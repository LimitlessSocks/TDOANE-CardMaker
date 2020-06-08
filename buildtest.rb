while true
    system "cls"
    puts "Building..."
    system "node r.js -o build/config.js"
    puts "Running test server (localhost:8080)"
    pid = spawn "node testserve.js"
    Process.wait pid
end
# while true
#     system "cls"
#     puts "Building..."
#     error_check = `node r.js -o build/config.js`
#     message = error_check.split("----------------")[0]
#     errored = message.index "Error:"
#     # errored = false
#     if errored
#         puts "!! Could not start server, compilation failed:"
#         puts message
#         STDIN.gets
#     else
#         puts "Running test server (localhost:8080)"
#         pid = spawn "node testserve.js"
#         Process.wait pid
#     end
# end
