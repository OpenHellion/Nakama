@npx tsc & nakama.exe migrate up --database.address postgres:password@127.0.0.1:5432 & nakama.exe --config config.yml --runtime.path="modules" --runtime.js_entrypoint "plugin.js" --database.address postgres:password@127.0.0.1:5432

pause