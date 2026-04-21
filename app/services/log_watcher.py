import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from app.services.log_parser import parse_log_line
from app.services.ml_detector import detect_threat


class LogHandler(FileSystemEventHandler):

    def __init__(self, analyzer, store, broadcaster):
        self.analyzer = analyzer
        self.store = store
        self.broadcast = broadcaster

    async def process(self, line):
        parsed = parse_log_line(line)

        prediction = detect_threat(parsed)

        if prediction:
            threat_obj = {
                "type": prediction,
                "severity": "medium",
                "raw_log": parsed.get("raw", ""),
                "metadata": parsed.get("metadata", {})
            }

            analysis = await self.analyzer.analyze(threat_obj)

            data = {
                "prediction": prediction,
                "parsed": parsed,
                "analysis": analysis
            }

            self.store.append(data)
            await self.broadcast({"type": "new_threat", "data": data})

    def on_modified(self, event):
        if event.is_directory:
            return

        with open(event.src_path, "r", errors="ignore") as f:
            lines = f.readlines()[-5:]   # last few lines
            for line in lines:
                print("LOG:", line.strip())


def start_watcher(path, analyzer, store, broadcaster):
    event_handler = LogHandler(analyzer, store, broadcaster)
    observer = Observer()
    observer.schedule(event_handler, path, recursive=False)
    observer.start()
    return observer