"""
Windows runtime setup for TensorFlow / MediaPipe native DLLs.

On Windows, Python 3.8+ does not search System32 for DLLs by default. TensorFlow
then fails with a misleading message about msvcp140.dll even when the MSVC
redistributable is installed. Call `configure_native_runtime()` before importing
tensorflow or mediapipe (when that build pulls TensorFlow).
"""

from __future__ import annotations

import os
import sys


def configure_native_runtime() -> None:
    if os.getenv("KSL_SKIP_WIN_DLL_BOOTSTRAP", "").strip().lower() in (
        "1",
        "true",
        "yes",
    ):
        return
    if sys.platform != "win32":
        return

    candidates: list[str] = []
    system_root = os.environ.get("SystemRoot", r"C:\Windows")
    for sub in ("System32", "SysWOW64"):
        path = os.path.join(system_root, sub)
        if os.path.isdir(path):
            candidates.append(path)

    # Installed "Microsoft Visual C++ Redistributable" packages (x64).
    pf = os.environ.get("ProgramFiles", r"C:\Program Files")
    for sub in (
        r"Microsoft Visual Studio\2022\Community\VC\Redist\MSVC",
        r"Microsoft Visual Studio\2022\BuildTools\VC\Redist\MSVC",
        r"Microsoft Visual Studio\2019\Community\VC\Redist\MSVC",
    ):
        redist_root = os.path.join(pf, sub)
        if not os.path.isdir(redist_root):
            continue
        try:
            versions = sorted(os.listdir(redist_root), reverse=True)
        except OSError:
            continue
        for ver in versions:
            for arch in ("x64", "amd64"):
                dll_dir = os.path.join(redist_root, ver, arch)
                if os.path.isdir(dll_dir):
                    candidates.append(dll_dir)

    seen: set[str] = set()
    for directory in candidates:
        norm = os.path.normcase(os.path.abspath(directory))
        if norm in seen:
            continue
        seen.add(norm)
        try:
            os.add_dll_directory(directory)
        except OSError:
            pass
        # Also prepend for older native loaders that ignore add_dll_directory.
        path = os.environ.get("PATH", "")
        if norm not in os.path.normcase(path).split(os.pathsep):
            os.environ["PATH"] = directory + os.pathsep + path


# Run once on import so `import runtime_bootstrap` is enough at process start.
configure_native_runtime()
