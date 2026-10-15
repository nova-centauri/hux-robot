#!/usr/bin/env python3
"""Host console for the Hux bench firmware (firmware/bench).

Opens the Pico 2 USB serial port, sends the 20 Hz keepalive that renews the
motion permission, logs every line the board sends to a CSV-style file and
gives you a prompt for the bench commands.

    python3 tools/bench/hux_bench.py                 # auto-detect the port
    python3 tools/bench/hux_bench.py --port /dev/cu.usbmodem1101 --log logs/E3

Stop the program (Ctrl-C or `quit`) and the keepalive stops with it. The
firmware then faults on `stale_command` 250 ms later. That is the deadman.

Needs pyserial:  python3 -m pip install pyserial
"""

from __future__ import annotations

import argparse
import datetime as dt
import glob
import os
import sys
import threading
import time

try:
    import serial  # type: ignore
except ImportError:  # pragma: no cover
    sys.exit("pyserial is missing: python3 -m pip install pyserial")

KEEPALIVE_HZ = 20


def find_port() -> str | None:
    patterns = ["/dev/cu.usbmodem*", "/dev/ttyACM*", "/dev/serial/by-id/*"]
    for pat in patterns:
        hits = sorted(glob.glob(pat))
        if hits:
            return hits[0]
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", help="serial port (default: first /dev/cu.usbmodem* or /dev/ttyACM*)")
    ap.add_argument("--log", default="logs", help="directory for the session log (default: logs)")
    ap.add_argument("--no-keepalive", action="store_true", help="do not send the 20 Hz keepalive")
    ap.add_argument("--quiet", action="store_true", help="do not echo T, and I, telemetry lines")
    args = ap.parse_args()

    port = args.port or find_port()
    if not port:
        sys.exit("no serial port found. Connect the Pico 2 or pass --port.")

    os.makedirs(args.log, exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    log_path = os.path.join(args.log, f"hux-bench-{stamp}.log")
    log = open(log_path, "a", buffering=1)
    print(f"# port {port}, log {log_path}")

    ser = serial.Serial(port, 115200, timeout=0.05)
    stop = threading.Event()

    def reader() -> None:
        while not stop.is_set():
            try:
                raw = ser.readline()
            except serial.SerialException as exc:
                print(f"# serial error: {exc}")
                stop.set()
                return
            if not raw:
                continue
            line = raw.decode("utf-8", "replace").rstrip("\r\n")
            host_ms = int(time.monotonic() * 1000)
            log.write(f"{host_ms},{line}\n")
            if args.quiet and (line.startswith("T,") or line.startswith("I,")):
                continue
            print(line)

    def keepalive() -> None:
        period = 1.0 / KEEPALIVE_HZ
        while not stop.is_set():
            try:
                ser.write(b"k\n")
            except serial.SerialException:
                return
            time.sleep(period)

    threads = [threading.Thread(target=reader, daemon=True)]
    if not args.no_keepalive:
        threads.append(threading.Thread(target=keepalive, daemon=True))
    for t in threads:
        t.start()

    time.sleep(0.3)
    ser.write(b"id\n")
    print("# type bench commands (help for the list). quit or Ctrl-C ends the keepalive.")
    try:
        while not stop.is_set():
            try:
                cmd = input("hux> ").strip()
            except EOFError:
                break
            if not cmd:
                continue
            if cmd in ("quit", "exit"):
                break
            log.write(f"{int(time.monotonic() * 1000)},>,{cmd}\n")
            ser.write((cmd + "\n").encode())
    except KeyboardInterrupt:
        print()
    finally:
        stop.set()
        time.sleep(0.1)
        try:
            ser.write(b"disarm\n")
        except Exception:
            pass
        ser.close()
        log.close()
        print(f"# log saved: {log_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
