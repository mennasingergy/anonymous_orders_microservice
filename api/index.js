require("dotenv").config();
const express = require("express");
const bodyParser = require('body-parser');
const { mongoClient } = require('./mongo');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/api/orders/:order_id", async (req, res) => {
  const db = await mongoClient();
  if (!db) res.status(500).send("Systems Unavailable");
  let order_ids = parseInt(req.params.order_id);

  const shipment = await db
    .collection("orders")
    .findOne({ order_id: order_ids });
  if (!shipment) {
    res.status(200).send({ message: "Order not found" });
  } else {
    res.status(200).send({ body: shipment, message: "Order retrived" });
  }
}); //zbaty dyy

app.post("/api/orders", async (req, res) => {
  try {
    const db = await mongoClient();
    if (!db) res.status(500).json("Systems Unavailable");

    console.log("[createOrder body]", req.body);
    const { order_id } = req.body;
    if (!order_id) return res.status(403).json("order_id is required");

    const shipment = await db
      .collection("orders")
      .findOne({ order_id: order_id });
    if (shipment)
      return res.status(403).json("Document already exists, cannot create");

    const shipmentStatus = "CREATED";

    const newShipmentDocument = await db.collection("orders").insertOne({
      order_id,
      order_status: shipmentStatus,
      name: req.body.name,
      quantity: req.body.quantity,
      price: req.body.price,
    });
    return res.status(200).json({
      body: newShipmentDocument,
      message: "Successfully created order",
    });
  } catch (e) {
    console.log("[createShipment] e", e);
  }
});

app.delete("/api/orders/:order_id", async (req, res) => {
  const db = await mongoClient();
  const post = await db
    .collection("orders")
    .findOne({ order_id: parseInt(req.params.order_id) });

  if (!post) {
    return res.status(404).json({ msg: "Order not found" });
  } else {
    db.collection("orders").remove({
      order_id: parseInt(req.params.order_id),
    });

    res.json({ msg: "Order removed" });
  }
});

app.patch("/api/orders/:order_id", async (req, res) => {
  try {
    // const { order_id } = createShipment.order_id;
    const db = await mongoClient();
    const order_id = parseInt(req.params.order_id);

    const shipment = await db
      .collection("orders")
      .findOne({ order_id: order_id });
    if (!shipment) return res.status(200).json("could not find order_id");

   

    const currentOrderStatus = shipment.order_status;
    const nextShipmentStatus = {
      CREATED: "PROCESSED",
      PROCESSED: "FULLFILLED",
      FULLFILLED: "FULLFILLED",
    }[currentOrderStatus];

    const updatedDocument = await db
      .collection("orders")
      .updateOne(
        { order_id: order_id },
        { $set: { order_status: nextShipmentStatus } }
      );
    res.status(200).json({
      body: nextShipmentStatus,
      message: "Successfully updated order status",
    });
  } catch (e) {
    console.log("[updateShipment] e", e);
  }
});

app.listen(process.env.PORT || 5000, async () => {
  console.log("The server is running")
  //await connectDB();
});
