async function find(req, res, next) {
  try {
    const toSearch = req.body.search.trim();
    const items = await Item.find({
      soldTo: { $in: [null, ""] },
      $or: [
        { itemName: { $regex: toSearch, $options: "i" } },
        { owner: { $regex: toSearch, $options: "i" } },
        { section: { $regex: toSearch, $options: "i" } },
      ],
    });
    res.status(200).json({ message: "Search results fetched", data: items });
  } catch (err) {
    res.status(500).json({ message: "Error occurred", error: err.message });
  }
}

async function findCat(req, res, next) {
  try {
    const toSearch = req.body.category.trim().toUpperCase();
    const items = await Item.find({ 
      section: toSearch,
      soldTo: { $in: [null, ""] },
    });
    res.status(200).json({ message: "Search results fetched", data: items });
  } catch (err) {
    res.status(500).json({ message: "Error occurred", error: err.message });
  }
}
