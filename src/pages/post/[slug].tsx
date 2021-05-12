import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'
import Prismic from '@prismicio/client'
import { useRouter } from 'next/router';
import Link from 'next/link';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string | null,
      body: {
        text: string,
      }[],
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  function estimatedReadingTime() {
    let words = 0

    post.data.content.forEach(content => {
      words += content.body.reduce((acc, curr) => {
        return acc + curr.text.split(' ').length
      }, 0) + content.heading?.split(' ').length | 0
    })

    const estimatedTime = Math.ceil(words / 200)
    
    return estimatedTime
  }

  const { isFallback } = useRouter()

  if (isFallback) {
    return <p>Carregando...</p>
  }

  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>

      <img
        src={post.data.banner.url}
        className={styles.banner}
      />
      <main className={styles.container}>
        <div className={styles.content}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInformationContent}>
            <FiCalendar size={20}/>
            <time>{post.first_publication_date}</time>

            <FiUser size={20}/>
            <p>{post.data.author}</p>

            <FiClock size={20}/>
            <time>{estimatedReadingTime()} min</time>
          </div>
          <p className={styles.editedDataPost}>* editado em {post.last_publication_date}</p>

          {post.data.content.map(content => (
            <div key={content.heading}>
              <h1>{content.heading}</h1>
              {content.body.map(paragraph => (
                <p key={paragraph.text}>{paragraph.text}</p>
              ))}
            </div>
          ))}
        </div>    
      </main>

      <footer className={styles.container}>
        <div className={styles.content}>
          <div className={styles.postNavegation}>
            <Link href='#'>
              <a>
                <strong>Como utilizar Hooks</strong>
                <p>Post anterior</p>
              </a>
            </Link>

            <Link href='#'>
              <a>
                <strong>Criando um app CRA do Zero</strong>
                <p>Próximo post</p>
              </a>
            </Link>
          </div>

                 
        </div>
      </footer>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ])

  const paths = posts.results.map(post => {
    return { params: { slug: post.uid } }
  })

  return {
    paths, 
    fallback: true
  }
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {})
  
  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'PP',
      {locale: ptBR}
    ),
    last_publication_date: format(
      new Date(response.last_publication_date),
      'PPPp',
      {locale: ptBR}
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return { 
          heading: content.heading,
          body: [...content.body]
        }
      }),
    }
  }

  return {
    props: { post },
    revalidate: 24 * 60 * 60 // 24 hours 
  }
};
