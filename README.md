# 🥁 Beatbox Lo-Fi Mixer

Una aplicación web interactiva para crear ritmos lo-fi usando React y Tone.js con síntesis de audio en tiempo real.

![Beatbox Lo-Fi Mixer](https://img.shields.io/badge/React-19.1.1-blue.svg)
![Tone.js](https://img.shields.io/badge/Tone.js-15.1.22-green.svg)
![Vite](https://img.shields.io/badge/Vite-7.1.3-purple.svg)

## ✨ Características

- 🎵 **Secuenciador de 16 pasos** - Crea patrones rítmicos complejos
- 🥁 **6 Instrumentos únicos** - Kick, Snare, Hi-Hat (cerrado/abierto), Clap, Percusión
- 🎛️ **Mesa de mezclas completa** - Control individual de volumen, mute y solo
- 🎼 **Síntesis en tiempo real** - Powered by Tone.js
- 📱 **Interfaz responsive** - Diseñada con Tailwind CSS
- 🎚️ **Control de tempo** - BPM ajustable (60-140)
- 🔄 **Patrones variables** - Soporte para 1-4 compases
- 🎲 **Generación aleatoria** - Crea patrones únicos al instante
- 💾 **Grabación de audio** - Exporta tus creaciones en formato WebM
- 📂 **Guardado de patrones** - Guarda y carga configuraciones en JSON
- 🎧 **Soporte para backing tracks** - Añade pistas de acompañamiento

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn

### Pasos de instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/Bzu-Kho/beatbox-lofi-mixer.git
   cd beatbox-lofi-mixer
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abre tu navegador**
   ```
   http://localhost:5173
   ```

## 🎹 Cómo usar la aplicación

### Controles principales
- **Play/Stop**: Inicia o detiene la reproducción
- **BPM**: Ajusta la velocidad del ritmo (60-140 BPM)
- **Compases**: Configura la longitud del loop (1-4 compases)

### Secuenciador
- Haz clic en los botones del grid para activar/desactivar sonidos
- Los botones brillantes indican pasos activos
- El indicador se mueve mostrando la posición actual

### Mesa de mezclas
- **Volumen**: Desliza para ajustar el nivel de cada instrumento
- **Mute**: Silencia instrumentos específicos
- **Solo**: Aísla instrumentos para escuchar solo uno

### Funciones avanzadas
- **Random**: Genera patrones aleatorios
- **Clear**: Limpia todo el patrón
- **Save**: Descarga el patrón como archivo JSON
- **Record**: Graba tu sesión como audio

## 🛠️ Tecnologías utilizadas

- **React 19** - Framework de interfaz de usuario
- **Tone.js 15** - Síntesis y secuenciación de audio
- **Vite 7** - Herramienta de construcción y desarrollo
- **Tailwind CSS** - Framework de estilos utilitarios
- **Lucide React** - Iconos modernos

## 📁 Estructura del proyecto

```
beatbox-lofi-mixer/
├── src/
│   ├── App.jsx          # Componente principal
│   └── main.jsx         # Punto de entrada
├── index.html           # Template HTML
├── vite.config.js       # Configuración de Vite
├── package.json         # Dependencias del proyecto
└── README.md           # Documentación
```

## 🎵 Instrumentos disponibles

| Instrumento | Descripción | Síntesis |
|------------|-------------|----------|
| **Kick** | Bombo profundo | MembraneSynth |
| **Snare** | Caja con carácter | Noise + Filter |
| **Hi-Hat C** | Charleston cerrado | Noise + HighPass |
| **Hi-Hat O** | Charleston abierto | Noise + HighPass |
| **Clap** | Palmas sintéticas | Noise + BandPass |
| **Perc** | Percusión metálica | MetalSynth |

## 🎼 Patrón por defecto

La aplicación incluye un groove lo-fi preconfigurado:
- Kick en tiempos 1 y 3
- Snare en tiempos 2 y 4
- Hi-hat cerrado en corcheas
- Toques de charleston abierto y percusión

## 🔧 Desarrollo

### Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Construir para producción
npm run preview  # Previsualizar build de producción
```

### Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 🎯 Roadmap

- [ ] Soporte para más instrumentos
- [ ] Efectos de audio (reverb, delay, filtros)
- [ ] Samples customizables
- [ ] Sincronización MIDI
- [ ] Colaboración en tiempo real
- [ ] Exportación en múltiples formatos

## 🙏 Agradecimientos

- [Tone.js](https://tonejs.github.io/) por la excelente librería de audio
- [React](https://reactjs.org/) por el framework
- [Tailwind CSS](https://tailwindcss.com/) por los estilos
- [Lucide](https://lucide.dev/) por los iconos

---

⭐ Si te gusta este proyecto, no olvides darle una estrella en GitHub!

🎵 **¡Crea beats increíbles y compártelos con el mundo!** 🎵