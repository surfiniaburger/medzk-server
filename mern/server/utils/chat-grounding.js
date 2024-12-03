const {ground} = require('./grounding');

async function chatGrounding(userInput, prediction) {
  // Adapt grounding.js logic for chat context.  This is a placeholder.
  const groundedResponse = await ground(userInput, prediction);
  return groundedResponse;
}

module.exports = { chatGrounding };
