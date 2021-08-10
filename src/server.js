import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from 'path';
const app = express();

app.use(express.static(path.join(__dirname,'/build')));
app.use(bodyParser.json());

app.get("/hello", (req, res) => res.send("Hello!"));
app.post("/hello", (req, res) => res.send(`Hello ${req.body.name}!`));

app.post("/api/articles/:name/upvote", (req, res) => {
  const articleName = req.params.name;
  articlesInfo[articleName].upvotes += 1;
  res
    .status(200)
    .send(
      `${articleName} now has ${articlesInfo[articleName].upvotes} upvotes`
    );
});

app.post("/api/articles/:name/add-comments", (req, res) => {
  const articleName = req.params.name;
  const { username, text } = req.body;
  articlesInfo[articleName].comments.push({ username, text });
  res.status(200).send(articlesInfo[articleName]);
});

//below are the mongo API related services
//db helper method to avoid boiler plate code
const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });
    const db = client.db("my-blog");
    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to DB", error });
  }
};
//api 1 to get the article-info
app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articlesInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articlesInfo);
  },res);
});

//api 2 to post the upvote specific to article
app.post("/api/articles/:name/upvotesmongo", async (req, res) => {

    withDB(async(db)=>{
        const articleName = req.params.name;
    const articlesInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    //after getting the article info you need to update upvote by one
    await db
      .collection("articles")
      .updateOne(
        { name: articleName },
        { $set: { upvotes: articlesInfo.upvotes + 1 } }
      );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
    },res)
    
});

//api 3 add comments with mongodb
app.post("/api/articles/:name/add-comments-withmongodb", (req, res) => {
    const articleName = req.params.name;
    const { username, text } = req.body;
    withDB(async (db)=>{
    const articlesInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    //after getting the article info you need to update upvote by one
    await db
      .collection("articles")
      .updateOne(
        { name: articleName },
        { $set: { comments: articlesInfo.comments.concat({username,text})} }
      );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);

    },res);
  });

app.get('*',(req,res)=>{
  res.sendFile(path.join(__dirname+'/build/index.html'));
})
app.listen(8000, () => console.log("Listening on port 8000"));
 