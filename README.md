# TypeScript Next.js example

This is a really simple project that shows the usage of Next.js with TypeScript.

## Deploy your own

Deploy the example using [Vercel](https://vercel.com?utm_source=github&utm_medium=readme&utm_campaign=next-example):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/vercel/next.js/tree/canary/examples/with-typescript&project-name=with-typescript&repository-name=with-typescript)

## How to use it?

Execute [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [npm](https://docs.npmjs.com/cli/init) or [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/) to bootstrap the example:

```bash
npx create-next-app --example with-typescript with-typescript-app
# or
yarn create next-app --example with-typescript with-typescript-app
```

Deploy it to the cloud with [Vercel](https://vercel.com/new?utm_source=github&utm_medium=readme&utm_campaign=next-example) ([Documentation](https://nextjs.org/docs/deployment)).

## Notes

This example shows how to integrate the TypeScript type system into Next.js. Since TypeScript is supported out of the box with Next.js, all we have to do is to install TypeScript.

```
npm install --save-dev typescript
```

To enable TypeScript's features, we install the type declarations for React and Node.

```
npm install --save-dev @types/react @types/react-dom @types/node
```

When we run `next dev` the next time, Next.js will start looking for any `.ts` or `.tsx` files in our project and builds it. It even automatically creates a `tsconfig.json` file for our project with the recommended settings.

Next.js has built-in TypeScript declarations, so we'll get autocompletion for Next.js' modules straight away.

A `type-check` script is also added to `package.json`, which runs TypeScript's `tsc` CLI in `noEmit` mode to run type-checking separately. You can then include this, for example, in your `test` scripts.

postgresql://postgres:postgres@localhost:5432/prismagraphql

model Album {
	id        String @id @default(uuid())
    name      String
    url       String
    artistId  String @unique
    artist    Artist @relation(fields: [artistId], references: [id])
}

model Artist {
    id     String @id @default(uuid())
    name   String
    url    String
    albums Album[]
}

prisma.albums.findMany({
    skip: args.skip
    take: Math.min(args.first, 50)
    orderBy: {
        year: "asc"
    }
})

const typeDefs = gql`
  type Query {
    albums(first: Int = 25, skip: Int = 0): [Album!]!
    getUsers: [User]
    getUser(name: String!): User!
  }

  type Mutation {
    createArtist(name: String!, url: String!): Artist!
    createAlbum(name: String!, url: String!, artistId: string): Album!
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
  type  User {
    id: ID
    login: String
    avatar_url: String
  }
`;

const resolvers = {
  Query: {
    albums: (_parent, args, _context) => {
      return prisma.albums.findMany({
        skip: args.skip
        take: Math.min(args.first, 50)
        orderBy: {
            year: "asc"
        }
      })
    }
    getUsers: async () => {
      try {
        const users = await axios.get("https://api.github.com/users");
        return users.data.map(({ id, login, avatar_url }) => ({
          id,
          login,
          avatar_url
        }));
      } catch (error) {
        throw error;
      }
    },
    getUser: async (_, args) => {
      try {
        const user = await axios.get(
          `https://api.github.com/users/${args.name}`
        );
        return {
          id: user.data.id,
          login: user.data.login,
          avatar_url: user.data.avatar_url
        };
      } catch (error) {
        throw error;
      }
    }
  },

  Mutation: {
    createAlbum: (_, args) => {
        return prisma.album.create({
            data: {
                name: args.name, 
                url: args.url, 
                artist: {
                    connect: { id: args.artistId }
                }
            }
        })
    }
    createArtist: (_, args) => {
        return prisma.artist.create({
            data: {name: args.name, url: args.url}
        })
    }
  }

  Album: {
    id: (album) => album.id,
    artist: (album, _, { loader }) => {
      return prisma.album.findUnique({
          where: {
              id: album.artist_id
          }
      })
      //return loader.artist.load(album.artist_id);
    }
  },

  Artist: {
    id: (artist) => artist.id,
    albums: (artist, args) => {
      return prisma.album.findMany({
          where: {
              artistId: artist.id
          }
          skip: args.skip
          take: Math.min(args.first, 50)
          orderBy: {
            year: "asc"
          }
      })
    }
  }
};

const loader = {
  artist: new DataLoader(async ids => {
    const artists = await prisma.artist.findMany({
      where: {
        id: {in: ids}
      }
    })
    return ids.map(id => artists.find(artist => artist.id === id))
  }) 
};