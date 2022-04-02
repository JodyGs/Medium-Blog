import { GetStaticProps } from 'next'
import Header from '../../components/Header'
import { sanityClient, urlFor } from '../../sanity'
import { Post } from '../../typings'
import PortableText from 'react-portable-text'
import { Children } from 'react'

interface Props {
  post: Post
}

function Article({ post }: Props) {
  console.log(post)

  return (
    <main>
      <Header />
      <img
        className="h40 w-full object-cover"
        src={urlFor(post.mainImage).url()}
        alt={`${post.title}`}
      />

      <article className="mx-auto max-w-3xl p-5">
        <h1 className="mt-10 mb-3 text-3xl">{post.title}</h1>
        <h2 className="mb-2 text-xl font-light text-gray-500">
          {post.description}
        </h2>
        <div className="flex items-center space-x-2">
          <img
            className="h-10 w-10 rounded-full"
            src={urlFor(post.author.image).url()!}
            alt={`${post.author.name} photography`}
          />
          <p className="text-sm font-extralight">
            {' '}
            Blog post by{' '}
            <span className="text-green-600">{post.author.name}</span> -
            Published at {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>

        <div>
          <PortableText
            className=""
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET!}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
            content={post.body}
            serializers={{
              h3: (props: any) => (
                <h3 className="my-5 text-2xl font-bold" {...props} />
              ),
              h4: (props: any) => (
                <h4 className="my-5 text-xl font-bold" {...props} />
              ),
              li: (props: any) => (
                <li className="ml-4 list-disc">{Children}</li>
              ),
              link: (props: any) => (
                <a className="text-blue-500 hover:underline">{children}</a>
              ),
            }}
          />
        </div>
      </article>
    </main>
  )
}

export default Article

export const getStaticPaths = async () => {
  const query = `*[_type == "post"]{
        _id,
        slug{
        current
      }
      }`

  const posts = await sanityClient.fetch(query)

  const paths = posts.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }))

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `
    *[_type == "post" && slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author-> {
        name,
        image
      },
      description,
      mainImage,
      slug,
      body
      }`

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  })

  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post,
    },
    revalidate: 60, //after 60sec, itll update the old cached version
  }
}
