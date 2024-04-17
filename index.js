// Importa las bibliotecas necesarias
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

// Crea una instancia de la aplicación Express
const app = express();

// Crea un servidor HTTP utilizando la aplicación Express
const server = http.createServer(app);

// Crea una instancia de Socket.IO adjuntándola al servidor HTTP
const io = socketIO(server);

// Define la variable `host` para el nombre de host del servidor
const host = process.env.HOST || "localhost";

// Define la variable `port` para el puerto del servidor
const port = process.env.PORT || 3000;

// Variable para controlar si la comunicación está abierta
let communicationOpen = true;

// Variable para contar el número de usuarios conectados
let userCount = 0;

// Define la ruta raíz de la aplicación Express
app.get("/", (req, res) => {
  // Envía el archivo HTML de la página principal
  res.sendFile(path.join(__dirname, "index.html"));
});

// Maneja la conexión de un nuevo cliente
io.on("connection", (socket) => {
  // Incrementa el contador de usuarios conectados
  userCount++;

  // Envía el número actualizado de usuarios a todos los clientes conectados
  io.emit("userCount", userCount);

  // Envía un mensaje al cliente sobre el estado actual de la comunicación
  socket.emit("toggleCommunication", { open: communicationOpen });

  // Maneja el evento "chat message"
  socket.on("chat message", ({ user, message }) => {
    // Obtiene la fecha y hora actual en formato ISO
    const time = new Date().toISOString();

    // Envía el mensaje con la fecha y hora a todos los clientes conectados
    io.emit("chat message", { user, message, time });
  });

  // Maneja el evento "toggleCommunication"
  socket.on("toggleCommunication", ({ open, user }) => {
    // Actualiza el estado de la comunicación
    communicationOpen = open;

    // Obtiene la fecha y hora actual en formato ISO
    const now = new Date();
    const time = now.toISOString();

    // Crea un mensaje con la información de la acción
    const message = open
      ? `${user} ha abierto la comunicación`
      : `${user} ha cerrado la comunicación`;

    // Envía el cambio de estado a todos los clientes conectados
    io.emit("toggleCommunication", { open, user, message, time });
  });

  socket.on("closeChat", () => {
    const now = new Date();
    const time = now.toISOString();

    io.emit("chat message", {
      user: "Sistema",
      message: "El chat será cerrado permanentemente en 5 segundos",
      time,
    });
    setTimeout(() => {
      const closeTime = new Date(); // Actualiza el tiempo de cierre
      const closeTimeString = closeTime.toISOString(); // Convierte a formato ISO

      io.emit("chat message", {
        user: "Sistema",
        message: "El chat ha sido cerrado permanentemente",
        time: closeTimeString, // Envía la hora actualizada
      });
      io.close(); // Cerrar el socket.io
      server.close(); // Cerrar el servidor HTTP
    }, 10000); // Espera 10 segundos antes de cerrar el chat
  });

  // Maneja la desconexión de un cliente
  socket.on("disconnect", () => {
    // Decrementar el contador de usuarios conectados
    userCount--;

    // Envía el número actualizado de usuarios a todos los clientes conectados
    io.emit("userCount", userCount);
  });
});

// Inicia el servidor HTTP en el puerto especificado
server.listen(port, host, () => {
  // Muestra un mensaje en la consola indicando que el servidor está en ejecución
  console.log(`Socket.IO server running at http://${host}:${port}/`);
});
