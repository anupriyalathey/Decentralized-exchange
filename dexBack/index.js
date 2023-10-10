const express = require("express"); //imports express.js
const Moralis = require("moralis").default; //import moralis library
const app = express(); //creates an instance of the express application
const cors = require("cors"); //imports Cross-  origin resource sharing middleware(allows server to be accessed from different domains)
require("dotenv").config(); //loads env variables
const port = 3001; //port on which server will listen for incoming requests

app.use(cors()); //enables server to accept requests from different origins
app.use(express.json()); //configures Express to parse incoming JSON data from requests. It allows the server to handle JSON payloads in requests.

app.get("/tokenPrice", async (req, res) => { // defines a route handler for HTTP GET requests to the "/tokenPrice" endpoint. 
  const {query} = req;
  const responseOne = await Moralis.EvmApi.token.getTokenPrice({
    address: query.addressOne
  })

  const responseTwo = await Moralis.EvmApi.token.getTokenPrice({
    address: query.addressTwo
  })

  // console.log(responseOne.raw);
  // console.log(responseTwo.raw);
  const usdPrices = {
    tokenOne: responseOne.raw.usdPrice,
    tokenTwo: responseTwo.raw.usdPrice,
    ratio: responseOne.raw.usdPrice / responseTwo.raw.usdPrice
  }

  return res.status(200).json(usdPrices); // sends a response to the client with the status code 200 and the JSON object containing the token prices.
});

Moralis.start({                  // initializes Moralis by calling the start method with an object that contains an API key .Moralis uses this API key to connect to blockchain networks and provides various blockchain-related functionalities for dApps.
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening for API Calls`); // starts the server and listens for incoming requests on the port specified by the port variable.
  });
});

// Put in browser:
// http://localhost:3001/tokenPrice?addressOne=0x514910771af9ca656af840dff83e8264ecf986ca&addressTwo=0xdac17f958d2ee523a2206206994597c13d831ec7

// Output:
// {"tokenOne":7.3087231266,"tokenTwo":1.0001055672,"ratio":7.307951646606932}
