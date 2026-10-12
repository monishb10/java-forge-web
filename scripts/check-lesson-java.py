"""Compile and run every everyday lesson example; compare its actual stdout."""
import json
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
examples = json.loads((root / 'lib/real-world-examples.json').read_text())
extra = json.loads((root / 'lib/roadmap-extra-lessons.json').read_text())
examples.update({topic: lesson['example'] for topic, lesson in extra.items()})
with tempfile.TemporaryDirectory(prefix='java-forge-lessons-') as directory:
    work = Path(directory)
    sources = []
    classes = {}
    for topic, example in examples.items():
        name = 'Example_' + topic.replace('-', '_')
        body = example['body']
        if 'static void main' not in body:
            body = 'public static void main(String[] args) {\n' + body + '\n}'
        source = work / (name + '.java')
        source.write_text('import java.util.*;\npublic class ' + name + ' {\n' + body + '\n}\n')
        sources.append(str(source))
        classes[topic] = name
    compiled = subprocess.run(['java', '--module', 'jdk.compiler/com.sun.tools.javac.Main', '-encoding', 'UTF-8', '-d', str(work), *sources], capture_output=True, text=True, timeout=60)
    assert compiled.returncode == 0, compiled.stderr
    for topic, name in classes.items():
        run = subprocess.run(['java', '-cp', str(work), name], capture_output=True, text=True, timeout=5)
        assert run.returncode == 0, (topic, run.stderr)
        expected = examples[topic]['output'].strip().replace('\r\n', '\n')
        actual = run.stdout.strip().replace('\r\n', '\n')
        assert actual == expected, (topic, expected, actual)
print(json.dumps({'javaExamplesCompiledAndRun': len(examples), 'expectedOutputsMatched': len(examples), 'status': 'passed'}))
