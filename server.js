const express = require("express");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
require("dotenv").config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/batsignal", async (req, res) => {
  const address = req.body.address;
  if (!address) return res.status(400).send("Address is required.");

  try {
    const apiKey = process.env.GOOGLE_MAPS_KEY;

    // 1. Geocode the address
    const geoResp = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: { address, key: apiKey }
    });

    if (!geoResp.data.results.length) {
      return res.status(404).send("Address not found.");
    }

    const { lat, lng } = geoResp.data.results[0].geometry.location;

    // 2. Get the static map image from Google
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=800x600&maptype=satellite&key=${apiKey}`;
    const mapImage = await loadImage(mapUrl);

    // 3. Load Bat-Signal PNG
    const batSignal = await loadImage(__dirname + "/public/batsignal.png");

    // 4. Composite images
    const canvas = createCanvas(mapImage.width, mapImage.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(mapImage, 0, 0);

    // Position Bat-Signal in the top-right corner
    const signalWidth = 200;
    const signalHeight = (batSignal.height / batSignal.width) * signalWidth;
    ctx.globalAlpha = 0.7;
    ctx.drawImage(batSignal, mapImage.width - signalWidth - 20, 20, signalWidth, signalHeight);

    // 5. Return final image
    res.set("Content-Type", "image/png");
    canvas.createPNGStream().pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating Bat-Signal image.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
