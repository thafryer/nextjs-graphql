import { ApolloServer, gql } from 'apollo-server-micro'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { User } from '../../interfaces'

const prisma = new PrismaClient()

const typeDefs = gql`
  type User {
    id: ID!
    login: String
    avatar_url: String
  }

  type Query {
    getAlbums(first: Int = 25, skip: Int = 0): [Album]
    getUsers: [User]
    getUser(name: String!): User!
  }

  type Artist {
    id: ID!
    name: String!
    url: String!
    albums(first: Int = 25, skip: Int = 0): [Album!]!
  }

  type Album {
    id: ID!
    name: String!
    year: String!
    artist: Artist!
  }
`

const resolvers = {
  Query: {
    getAlbums: (_: void, args: any) => {
      return prisma.album.findMany({
        skip: args.skip,
        take: Math.min(args.first, 50),
        orderBy: {
          year: 'asc',
        },
      })
    },
    getUsers: async () => {
      try {
        const users = await axios.get('https://api.github.com/users')
        return users.data.map(({ id, login, avatar_url }: User) => ({
          id,
          login,
          avatar_url,
        }))
      } catch (err) {
        throw err
      }
    },
    getUser: async (_: void, args: any) => {
      try {
        const user = await axios.get(
          `https://api.github.com/users/${args.name}`
        )
        return {
          id: user.data.id,
          login: user.data.login,
          avatar_url: user.data.avatar_url,
        }
      } catch (error) {
        throw error
      }
    },
  },
}
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => {
    return {}
  },
})

const handler = apolloServer.createHandler({ path: '/api/graphql' })

export const config = {
  api: {
    bodyParser: false,
  },
}

export default handler
