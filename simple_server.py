import http.server
import socketserver
import json
from urllib.parse import urlparse, parse_qs
import subprocess

PORT = 8021

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        text = data.get('text', '')

        result = generate_audio(text)

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

def generate_audio(text):
    try:
        # Ejecuta el script apiaudios.py con el texto como argumento
        result = subprocess.run(['python', 'apiAudio.py', text], capture_output=True, text=True)
        
        if result.returncode == 0:
            return {'success': True, 'message': 'Audio generado correctamente'}
        else:
            return {'success': False, 'error': result.stderr}
    except Exception as e:
        return {'success': False, 'error': str(e)}

Handler = MyHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()