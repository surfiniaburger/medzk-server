import express from "express";

// This will help us connect to the database
import db from "../db/connection.js";

// This help convert the id from string to ObjectId for the _id.
import { ObjectId } from "mongodb";

// router is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const router = express.Router();

// This section will help you get a list of all the records.
router.get("/", async (req, res) => {
  let collection = await db.collection("records");
  let results = await collection.find({}).toArray();
  res.send(results).status(200);
});

// This section will help you get a single record by id
router.get("/:id", async (req, res) => {
  let collection = await db.collection("records");
  let query = { _id: new ObjectId(req.params.id) };
  let result = await collection.findOne(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// This section will help you create a new record.
router.post("/", async (req, res) => {
  try {
    let newDocument = {
      name: req.body.name,
      diagnosis: req.body.diagnosis,
      severity: req.body.severity,
    };
    let collection = await db.collection("records");
    let result = await collection.insertOne(newDocument);
    res.send(result).status(204);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding record");
  }
});

// This section will help you update a record by id.
router.patch("/:id", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const updates = {
      $set: {
        name: req.body.name,
        diagnosis: req.body.diagnosis,
        severity: req.body.severity,
      },
    };

    let collection = await db.collection("records");
    let result = await collection.updateOne(query, updates);
    res.send(result).status(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating record");
  }
});

// This section will help you delete a record
router.delete("/:id", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };

    const collection = db.collection("records");
    let result = await collection.deleteOne(query);

    res.send(result).status(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting record");
  }
});

router.get("/recommendations/:condition", async (req, res) => {
  const condition = req.params.condition;

  // Recommendations with sources
  const recommendations = {
    diabetes: {
      recommendations: [
        {
          advice: "Monitor blood sugar levels regularly.",
          source: {
            name: "NIDDK - Healthy Living with Diabetes",
            link: "https://www.niddk.nih.gov/health-information/diabetes/overview/healthy-living-with-diabetes"
          }
        },
        {
          advice: "Follow a balanced diet with low sugar and carbohydrates.",
          source: {
            name: "Endotext - Dietary Advice For Individuals with Diabetes",
            link: "https://www.ncbi.nlm.nih.gov/books/NBK279012/"
          }
        },
        {
          advice: "Exercise regularly to maintain a healthy weight.",
          source: {
            name: "Better Health Channel - Diabetes and Healthy Eating",
            link: "https://www.betterhealth.vic.gov.au/health/conditionsandtreatments/diabetes-and-healthy-eating"
          }
        },
        {
          advice: "Consult a healthcare professional for personalized advice.",
          source: {
            name: "Healthline - 16 Best Foods for People with Diabetes",
            link: "https://www.healthline.com/nutrition/16-best-foods-for-diabetics"
          }
        }
      ]
    },
    hypertension: {
      recommendations: [
        {
          advice: "Reduce salt intake.",
          source: {
            name: "American Heart Association - Sodium and Salt",
            link: "https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/nutrition-basics/sodium-and-salt"
          }
        },
        {
          advice: "Maintain a healthy weight.",
          source: {
            name: "CDC - Healthy Weight",
            link: "https://www.cdc.gov/healthyweight/index.html"
          }
        },
        {
          advice: "Exercise regularly.",
          source: {
            name: "Mayo Clinic - Exercise and Hypertension",
            link: "https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/in-depth/exercise-and-high-blood-pressure/art-20045839"
          }
        },
        {
          advice: "Monitor blood pressure frequently.",
          source: {
            name: "American Heart Association - Monitoring Blood Pressure",
            link: "https://www.heart.org/en/health-topics/high-blood-pressure/monitoring-blood-pressure"
          }
        }
      ]
    },
    // Add more conditions as needed
  };

  const conditionData = recommendations[condition.toLowerCase()];

  if (conditionData) {
    res.status(200).json({
      condition,
      recommendations: conditionData.recommendations,
    });
  } else {
    res.status(404).send("Recommendations not found for this condition.");
  }
});

export default router;
