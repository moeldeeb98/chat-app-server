const { createServer, createPubSub } = require('@graphql-yoga/node')
const messages = [];
const subscribers = [];
const onMessagesUpdates = (fn) => {
    subscribers.push(fn)
}
const typeDefs = `
    type Message {
        id: ID!
        user: String!
        content: String!
    }

    type Query {
        messages: [Message!]
    }

    type Mutation {
        postMessage(user: String!, content: String!): ID!
    }

    type Subscription {
        messages: [Message!]
    }
`
const resolvers = {
    Query: {
        messages: () => messages,
    },
    Mutation: {
        postMessage: (parent, {user,content}) => {
            const id = messages.length;
            messages.push({
                id,
                content,
                user
            });
            subscribers.forEach(fn => fn())
            return id;
        } 
    },
    Subscription: {
        messages: {
            subscribe: (parent, args, {pubsub}) => {
                const channel = Math.random().toString(36).slice(2, 15);
                onMessagesUpdates(()=>pubsub.publish(channel, {messages}))
                setTimeout(()=>pubsub.publish(channel, {messages}), 0);
                return pubsub.asyncIterator(channel);
            }
        }
    }
}

const pubsub = createPubSub();
const server = createServer({
    schema: {
      typeDefs: typeDefs,
      resolvers: resolvers,
      content: {pubsub}
    },
  })

server.start()