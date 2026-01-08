import http.server
import socketserver
import sys

# Define the port
PORT = 8086

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """
    Subclass of SimpleHTTPRequestHandler that sends headers to disable
    browser caching for all served files.
    """
    def end_headers(self):
        # Disable caching for all files
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

def run_server():
    # Allow the port to be reused immediately after the server stops
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
            print(f"🚀 FlapEmu Dev Server running at: http://localhost:{PORT}")
            print(f"🛠️  Cache is strictly disabled via HTTP Headers.")
            print(f"Press Ctrl+C to stop the server.")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped.")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_server()
