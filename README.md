# Laboratorio 3 - Algoritmos de Enrutamiento
Este proyecto implementa varios algoritmos de enrutamiento de red, incluyendo vector de distancia, estado de enlace y flooding. El objetivo es simular el comportamiento de estos algoritmos en una red definida por una topología.


## Algoritmos Implementados
- Vector de Distancia: Implementado en distance-vector/index.js.
- Estado de Enlace: Implementado en link-state/index.js.
- Flooding: Implementado en flooding/index.js.
- Dijkstra: Implementado en dijkstra/index.js.

## Requisitos
- Node.js
- npm

## Instalación
Clona el repositorio:
    
```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_REPOSITORIO>
```

Instala las dependencias:

```bash
npm install
```

Configuración
Define el algoritmo a utilizar en consts.js:
    
```javascript
const ALGORITHM = 'distance-vector'; // 'distance-vector', 'link-state', 'flooding' o 'dijkstra'
```

Configura la topología de la red en topo.json.

Configura los nombres de los nodos en names.json.

## Ejecución
Para iniciar el nodo, ejecuta el siguiente comando:
    
```bash
node main.js
```

Se te pedirá que ingreses tu usuario y contraseña. Una vez autenticado, el nodo comenzará a ejecutar el algoritmo de enrutamiento seleccionado. Ojo: el usuario tienen que estar en la lista de usuarios en el archivo names.json.
