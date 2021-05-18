import { ApolloServer, gql } from 'apollo-server-micro'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import Cors from 'micro-cors'
import DataLoader from 'dataloader'
import { User } from '../../interfaces'

const prisma = new PrismaClient()

const typeDefs = gql`
  type Query {
    getAlbums(first: Int = 25, skip: Int = 0): [Album]
    getUsers: [User]
    getUser(name: String!): User!
  }

  type Mutation {
    createArtist(name: String!, url: String!): Artist!
    createAlbum(name: String!, year: String!, artistId: String): Album!
  }

  type User {
    id: ID!
    login: String
    avatar_url: String
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
  Mutation: {
    createAlbum: (_: void, args: any) => {
      return prisma.album.create({
        data: {
          name: args.name,
          year: args.year,
          artist: {
            connect: { id: args.artistId },
          },
        },
      })
    },
    createArtist: (_: void, args: any) => {
      return prisma.artist.create({
        data: { name: args.name, url: args.url },
      })
    },
  },
  Album: {
    id: (album: any) => album.id,
    artist: (album: any, _: void, { loader }: any) => {
      return loader.artist.load(album.artist_id)
    },
  },

  Artist: {
    id: (artist: any) => artist.id,
    albums: (artist: any, args: any) => {
      return prisma.album.findMany({
        where: {
          artistId: artist.id,
        },
        skip: args.skip,
        take: Math.min(args.first, 50),
        orderBy: {
          year: 'asc',
        },
      })
    },
  },
}

const loader = {
  artist: new DataLoader(async (ids) => {
    const artists = await prisma.artist.findMany({
      where: {
        id: { in: ids as string[] },
      },
    })
    return ids.map((id) => artists.find((artist) => artist.id === id))
  }),
}

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true,
  introspection: true,
  context: () => {
    return { loader }
  },
})

const cors = Cors({
  allowMethods: ['GET', 'POST', 'OPTIONS'],
})

const handler = apolloServer.createHandler({ path: '/api/graphql' })

export const config = {
  api: {
    bodyParser: false,
  },
}

export default cors(handler)
