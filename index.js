import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "123456",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;
var col;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted(c = 1) {
  const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id=$1", [c]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  console.log(result.rows);

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: "teal",
  });

});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  var id;
  for (let i = 0; i < users.length; i++) {
    if (users[i].color === col) {
      id = users[i].id;
    }
  }

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );
    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, id]
      );
      const countries = await checkVisisted(id);

      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: col,
      });
    } catch (err) {
      console.log(err);
      const countries = await checkVisisted(id);

      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: col,
        error: "Country has already been added, try again."
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisisted(id);

    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: col,
      error: "Country name does not exist, try again."
    });
  }
});

app.post("/user", async (req, res) => {
  const input = parseInt(req.body["user"]);

  try {
    const result = await db.query(
    "SELECT country_code FROM visited_countries WHERE user_id=$1",
    [input]
  );
  const countries = await checkVisisted(input);
  const r = await db.query("SELECT * FROM users");
  const c = r.rows
  var country = [];
  for (let i = 0; i < c.length; i++) {
    if (c[i].id === input) {
      country = c[i];
    }
  }
  col = country.color
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: country.color,
  });
  } catch {
    res.render("new.ejs");
  }
  
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const name = req.body["name"];
  const color = req.body["color"];

  try {
    await db.query(
      "INSERT INTO users (name, color) VALUES ($1,$2)",
      [name, color]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
