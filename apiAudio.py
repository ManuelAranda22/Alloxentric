import requests
import datetime
import subprocess
import sys

# URL de la API TTS
url = 'http://35.215.229.147:8002/default/inference'

def obtener_audio(texto):
    params = {
        'text': texto
    }

    # Realizar la solicitud
    response = requests.post(url, json=params)
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    audio_filename = f'public/audio/audio_{timestamp}.wav'
    with open(audio_filename, 'wb') as audio_file:
        audio_file.write(response.content)

    print(f"Audio guardado como {audio_filename}")
    return audio_filename

def guardar_transcripcion(texto, audio_filename):

    transcripcion_filename = f'public/transcriptions/{audio_filename.split("/")[-1]}.txt'
    
    with open(transcripcion_filename, 'w', encoding='utf-8') as trans_file:
        trans_file.write(texto)
    
    print(f"Transcripción guardada como {transcripcion_filename}")
    return transcripcion_filename

def generar_fonemas(audio_filename, transcripcion_filename):
    # Comando para ejecutar Rhubarb Lip Sync
    rhubarb_command = [
        'rhubarb', audio_filename,
        '--dialogFile', transcripcion_filename,  # Incluir el archivo de transcripción
        '--recognizer', 'phonetic',  # Seleccionamos el reconocedor
        '--exportFormat', 'json',    # Seleccionamos el formato de exportación
        '-o', f'public/mapps/{audio_filename.split("/")[-1]}.json'
    ]

    # Ejecutar el comando
    subprocess.run(rhubarb_command)

    mapp_filename = f'public/mapps/{audio_filename.split("/")[-1]}.json'
    print(f"Fonemas generados y guardados en {mapp_filename}")
    return mapp_filename

def guardar_ultimo_archivo(audio_filename, mapp_filename):
    with open('public/ultimo_archivo.txt', 'w') as ultimo_archivo:
        ultimo_archivo.write(f'{audio_filename}\n{mapp_filename}')
    print(f"Último audio y mapeo guardados en public/ultimo_archivo.txt")

# Ejemplo de uso
if __name__ == "__main__":
    if len(sys.argv) > 1:
        texto = sys.argv[1]
    else:
        texto = "bienvenido"
    
    # Generar y guardar
    audio_filename = obtener_audio(texto)    
    transcripcion_filename = guardar_transcripcion(texto, audio_filename)  
    mapp_filename = generar_fonemas(audio_filename, transcripcion_filename)
    guardar_ultimo_archivo(audio_filename, mapp_filename)
