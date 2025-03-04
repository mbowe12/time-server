const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3001;

// middleware
app.use(cors());
app.use(express.json());

// serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));
}

// store metadata for files
let fileMetadata = {};

// load existing metadata if it exists
const metadataPath = path.join(__dirname, "metadata.json");
try {
  if (fs.existsSync(metadataPath)) {
    fileMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  }
} catch (error) {
  console.error("error loading metadata:", error);
}

// save metadata to file
const saveMetadata = () => {
  try {
    fs.writeFileSync(metadataPath, JSON.stringify(fileMetadata, null, 2));
  } catch (error) {
    console.error("error saving metadata:", error);
  }
};

// configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    // create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // use a simple timestamp as filename but preserve extension
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

// file filter to only allow audio files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("invalid file type. only mp3, wav, and ogg files are allowed.")
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500mb limit
  },
});

// store playlist order with hour assignments
let playlistOrder = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  filename: null,
}));

// endpoints
app.post("/api/upload", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "no file uploaded" });
  }

  const fileInfo = {
    filename: req.file.filename,
    title: req.body.title,
    artist: req.body.artist,
    size: req.file.size,
    uploadDate: new Date().toISOString(),
  };

  // store metadata
  fileMetadata[req.file.filename] = {
    title: req.body.title,
    artist: req.body.artist,
    originalName: req.file.originalname,
  };
  saveMetadata();

  res.json(fileInfo);
});

app.get("/api/files", (req, res) => {
  const uploadDir = "uploads";
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "error reading files directory" });
    }

    const fileList = files.map((filename) => {
      const stats = fs.statSync(path.join(uploadDir, filename));
      const metadata = fileMetadata[filename] || {};

      return {
        filename,
        title: metadata.title || filename,
        artist: metadata.artist || "",
        size: stats.size,
        uploadDate: stats.mtime,
      };
    });

    res.json(fileList);
  });
});

app.post("/api/playlist/order", (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order) || order.length !== 24) {
    return res.status(400).json({ error: "invalid playlist order format" });
  }
  // validate that each item has hour and optional filename
  if (
    !order.every(
      (item, index) =>
        item.hour === index &&
        (item.filename === null || typeof item.filename === "string")
    )
  ) {
    return res.status(400).json({ error: "invalid hour assignments" });
  }
  playlistOrder = order;
  res.json({ success: true, order: playlistOrder });
});

app.get("/api/playlist/order", (req, res) => {
  res.json({ order: playlistOrder });
});

// serve uploaded files
app.use("/uploads", express.static("uploads"));

// handle any remaining routes by serving the React app
app.get("*", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.sendFile(path.join(__dirname, "client/build/index.html"));
  } else {
    res.redirect("http://localhost:3000");
  }
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
