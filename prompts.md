This project has been developed with the assistance of AI. This file includes prompts used specifically in relation to development of the Cloudflare AI Features

## Prompts:

- Give me a high-level guide on the steps of migrating from Firebase to Railway-based architecture with SQL storage and automatic polling

- I want to add some data from the database to add to the user prompt, and later ill add a front end but lets focus on the backend, we need to focus on chat memory and integration.

- Explain the structure of a typical cloudflare worker

- So is it as simple as adding an endpoint to run the AI, and should I have the flow be, chatbox send to backend which sends to worker which sends back to backend back to chatbox?

- Want the ai to get as much context as possible not just most recent 50 songs, so I thought of giving it all the users listening data at the beginning in the system prompt but this might be too long I dont know how I can set it up that the ai is asked a question then as its thinking it get more data that it needs on its own because this isnt shortening the available data

- This is the current system prompt — think we can improve it a bit to get better responses for the user

- Writing a README file, i've included instructions first ensure nothing is missing and it makes sense, additionally include a simple diagram of the project structure

- This is gonna be where the user chats with the AI so we need an input box and support to take display messages sent and received on left and right sides

- I've set up a simple chat box implementation could you make it that the scroll bar always moved down to the bottom on a new chat

- Go through the current project and ensure the env variables are being used correctly and no private keys are visible 

- Currently the chatbot can only query recent tracks but we have a lot more info like top artists weekly listening amount artistis info but this is only neccesary in certain cases

- I want to get a markdown response from the AI to make it more appealing to the user, how would I display this on the frontend

- Thinking about giving the AI access to different endpoints and having it decide which to use for a query, would this be feasible and more importantly efficient

- Lets undo that, lets add back the end point to get all the user tracks instead, and everything and all the other end points pass them in as system prompts, then the ai will always have them as context

- About to push this to prod as an MVP, add a readme template for the project
