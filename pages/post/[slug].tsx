import { GetStaticProps } from 'next'
import Header from '../../components/Header'
import { sanityClient, urlFor } from '../../sanity'
import { Post } from '../../typings'
import PortableText from 'react-portable-text'
import { Children, useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'

interface IFormInput{
    _id: string;
    name: string;
    email: string;
    comment: string;
}

interface Props {
  post: Post
}

function Article({ post }: Props) {

  const [submitted, setSubmitted] = useState(false)


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    await fetch('/api/createComment', {
      method: "POST",
      body: JSON.stringify(data),
    }).then(() => {
      console.log(data);
      setSubmitted(true)
    }).catch((err) => {
      console.log(err);
      setSubmitted(true)
    })
  }

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

      <hr className="my-5 mx-auto max-w-lg border-yellow-500" />
          
      {submitted ? (
        <div className='flex flex-col p-10 my-10 bg-yellow-500 text-white max-w-2xl mx-auto'>
        <h3 className='text-3xl font-bold'>Thank you for submitting your comment !</h3>
        <p>Once it has been approved, it will appear below !</p>
        </div>
      ) : (<form onSubmit={handleSubmit(onSubmit)} className="mx-auto mb-10 flex max-w-2xl flex-col p-5">
        <h3 className="text-sm text-yellow-500">Enjoyed this article ?</h3>
        <h4 className="text">Leave a comment below !</h4>
        <hr className="mt-2 py-3" />

          <input 
          {...register('id')}
          type="hidden"
          name="_id"
          value={post._id}
          />

        <label className="mb-5 block" htmlFor="Name">
          <span className="text-gray-700">Name</span>
          <input
          {...register("name", {required: true})}
            className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-yellow-500"
            id="Name"
            placeholder="John Doe"
            type="text"
          />
        </label>
        <label className="mb-5 block" htmlFor="Mail">
          <span className="text-gray-700">Email</span>
          <input
          {...register("email", {required: true})}
            className="form-input mt-1 block w-full rounded border py-2 px-3 shadow outline-yellow-500"
            id="Mail"
            placeholder="JohnDoe@example.com"
            type="email"
          />
        </label>
        <label className="mb-5 block" htmlFor="Comment">
          <span className="text-gray-700">Comment</span>
          <textarea
          {...register("comment", {required: true})}
            className="form-textarea mt-1 block w-full rounded border py-2 px-3 shadow outline-yellow-500"
            id="Comment"
            placeholder="Your text here..."
            rows={8}
          />
        </label>

        {/* Errors will return when field validation fails */}
        <div className='flex flex-col p-5'>
          {errors.name &&(
            <span className='text-red-500'>- The name Field is required</span>
          )}
          {errors.comment &&(
            <span className='text-red-500'>- The comment Field is required</span>
          )}
          {errors.email &&(
            <span className='text-red-500'>- The Email Field is required</span>
          )}
        </div>

        <input type="submit" className='shadow bg-yellow-500 hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded cursor-pointer' />
      </form>)}

      {/* Comments */}
      <div className='flex flex-col p-10 my-10 max-w-2xl mx-auto shadow-yellow-500 shadow space-y-2'>
        <h3 className='text-4xl'>Comments</h3>
        <hr className='pb-2'  />

        {/* {post.comments.map((comment) => (
          <div key={comment._id}>
            <p><span className='text-yellow-500'>{comment.name}</span> : {comment.comment}</p>
          </div>
        ))} */}
      </div>
      
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
      'comment': *[
        _type == "comment" &&
        post._ref == ^._id &&
        approved == true],
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
