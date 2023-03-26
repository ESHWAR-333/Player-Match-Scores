const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const convertPlayerDetails = (each) => {
  return {
    playerId: each.player_id,
    playerName: each.player_name,
  };
};

const convertMatchDetails = (each) => {
  return {
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  };
};

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running on : http://localhost:3000");
    });
  } catch (e) {
    console.log(`there is DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1
app.get("/players/", async (request, response) => {
  const playerQuery = `select * from player_details;`;
  const dbResponse = await db.all(playerQuery);
  response.send(dbResponse.map((each) => convertPlayerDetails(each)));
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerIdQuery = `select * from player_details where player_id=${playerId}`;
  const dbResponse = await db.get(playerIdQuery);
  response.send(convertPlayerDetails(dbResponse));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const requestBody = request.body;
  const { playerName } = requestBody;
  const playerUpdateQuery = `update player_details set 
  player_name='${playerName}'
  where player_id='${playerId}';
  `;
  await db.run(playerUpdateQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `select * from match_details where
  match_id=${matchId};`;
  const dbResponse = await db.get(matchQuery);
  response.send(convertMatchDetails(dbResponse));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const matchQuery = `SELECT
	      *
	    FROM match_details  NATURAL JOIN player_match_score
        WHERE player_id=${playerId};`;
  const matchResponse = await db.all(matchQuery);
  response.send(matchResponse.map((each) => convertMatchDetails(each)));
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerQuery = `SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const playerResponse = await db.all(playerQuery);
  response.send(playerResponse);
  //   response.send(playerResponse.map((each) => convertMatchDetails(each)));
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerScoreQuery = `select
             player_details.player_id as playerId,
              player_details.player_name as playerName,
              sum(player_match_score.score) as   totalScore,
              sum(fours) as totalFours,
              sum(sixes) as  totalSixes
              from player_details inner join player_match_score
              on
              player_details.player_id = player_match_score.player_id
              where
              player_details.player_id='${playerId}';`;
  const playerScoreResponse = await db.get(playerScoreQuery);
  response.send(playerScoreResponse);
});

module.exports = app;
