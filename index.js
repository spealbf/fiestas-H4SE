// Usar dotenv para leer variables de entorno (asegúrate de tener instalado dotenv)
require('dotenv').config();
console.log("Clave Stripe:", process.env.STRIPE_SECRET_KEY);

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sql, config } = require('./db');

const app = express();
const path = require('path');
const PORT = 3001;

const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const streamBuffers = require('stream-buffers'); // para manejar buffers en memoria

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // agrega tu clave secreta en .env



const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: "pedrocruzarroyo95@gmail.com",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

// Middleware

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Ruta de prueba.
app.get('/', (req, res) => {
  res.send('API de Fiestas_PSM funcionando ✅');
});

// Ruta para obtener fiestas
app.get('/api/fiestas', async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query('SELECT * FROM Fiestas where DIsponible =1');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener fiestas:', err);
    res.status(500).json({ error: 'Error de servidor' });
  }
});

//Ruta para obtener las noticias por su id para los detalles
app.get('/api/fiestas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Fiestas WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener noticia por ID:', err);
    res.status(500).json({ error: 'Error de servidor' });
  }
});

//Insertar Entrada
app.post('/api/fiestas/:id/entradas', async (req, res) => {
  const idFiesta = parseInt(req.params.id);
  const { nombre, apellidos, fecha_nacimiento, dni, correo } = req.body;

  console.log('Datos recibidos del frontend:', req.body);

  try {
    const pool = await sql.connect(config);

    await pool.request()
  .input('Id_Fiesta', sql.Int, idFiesta)
  .input('Nombre', sql.NVarChar(sql.MAX), nombre)
  .input('Apellidos', sql.NVarChar(sql.MAX), apellidos)
  .input('Fecha_Nacimiento', sql.DateTime, new Date(fecha_nacimiento))
  .input('DNI', sql.NVarChar(50), dni)
  .input('Correo_Electronico', sql.NVarChar(sql.MAX), correo)
  .query(`
    INSERT INTO Entradas (Id_Fiesta, Nombre, Apellidos, Fecha_Nacimiento, DNI, Correo_Electronico)
    VALUES (@Id_Fiesta, @Nombre, @Apellidos, @Fecha_Nacimiento, @DNI, @Correo_Electronico)
  `);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la entrada o enviar el correo' });
  }
});

  /*
  // Crear texto QR
    const qrText = `${dni}+${nombre}+${apellidos}`;

    // Generar código QR en formato data URL
    const qrDataUrl = await QRCode.toDataURL(qrText);

    // Crear PDF en memoria
    const doc = new PDFDocument();
    const writableStreamBuffer = new streamBuffers.WritableStreamBuffer();

    doc.pipe(writableStreamBuffer);

    doc.fontSize(20).text('Entrada para Fiesta PSM', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Nombre: ${nombre}`);
    doc.text(`Apellidos: ${apellidos}`);
    doc.text(`DNI: ${dni}`);
    doc.moveDown();

    // Insertar código QR en el PDF
    const qrImageBuffer = Buffer.from(qrDataUrl.split(",")[1], 'base64');
    doc.image(qrImageBuffer, {
      fit: [150, 150],
      align: 'center',
      valign: 'center'
    });

    doc.end();

    // Esperar a que el PDF termine de escribirse
    writableStreamBuffer.on('finish', async () => {
      const pdfBuffer = writableStreamBuffer.getContents();

      // Enviar correo con adjunto PDF
      await transporter.sendMail({
        from: '"Fiestas PSM" <no-reply@fiestaspsm.com>',
        to: correo,
        subject: 'Tu entrada para Fiesta PSM',
        text: `Hola ${nombre}, adjunto tienes tu entrada con el código QR.`,
        attachments: [
          {
            filename: 'entrada.pdf',
            content: pdfBuffer
          }
        ]
      });

      res.status(201).json({ mensaje: 'Entrada registrada y correo enviado correctamente' });
    });

  */



// Ruta para crear sesión de pago
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { amount, fiestaNombre } = req.body; // cantidad en centavos

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: fiestaNombre || 'Entrada Fiesta PSM' },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/formulario.html?status=success',
      cancel_url: 'http://localhost:3000/formulario.html?status=cancel',

    });

    console.log("Sesión Stripe creada:", session.id); // 👈

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error en create-checkout-session:", error); // 👈
    res.status(500).json({ error: 'Error creando sesión de pago' });
  }
});

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});