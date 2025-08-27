@echo off
REM Batch file wrapper for running tests to bypass PowerShell restrictions
REM Usage: run-tests.bat [test-file-pattern] [additional-args]

if "%1"=="" (
    echo Running all tests...
    node node_modules\vitest\dist\cli.js run
) else (
    echo Running tests for: %1
    node node_modules\vitest\dist\cli.js run %*
)