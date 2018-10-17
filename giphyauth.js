var GiphyAPI = require('giphy-js-sdk-core');
var giphy = GiphyAPI(process.env.GIPHY_KEY);
module.exports = giphy;
