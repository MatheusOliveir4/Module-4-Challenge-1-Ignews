import Head from 'next/head'
import Link from 'next/link';
import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client'
import { getPrismicClient } from '../services/prismic';
import { useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi'

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState(postsPagination)

  async function handleLoadPosts() {
    fetch(posts.next_page)
    .then(response => response.json())
    .then(data => {
      data = {
        ...data,
        results: data.results.map(post => {
          return {
            ...post,
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'PP',
              { locale: ptBR }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            }
          }
        })
      }

      const newPosts = {
        ...data,
        results: [
          ...posts.results,
          ...data.results
        ] 
      }

      setPosts(newPosts)      
    })
  }
  
  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main className={styles.container}>
        <div className={styles.content}>
          {posts.results.map(post => (
            <Link key={post.uid} href={'/post/' + post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInformationContent}>
                  <FiCalendar size={20}/>
                  <time>{post.first_publication_date}</time>
                  
                  <FiUser size={20}/>
                  <p>{post.data.author}</p>
                </div>
              </a>
            </Link>
          ))}

          {posts.next_page
           ? <a
              className={styles.loadingButton}
              onClick={handleLoadPosts}
             >
            Carregar mais posts
            </a> 
           : ''
          }
        </div>
          
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient()
  let postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    pageSize: 2,
  })

  const resultProps = postsResponse.results.map(post => {
    return {
      ...post,
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'PP',
        { locale: ptBR }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  postsResponse = {
    ...postsResponse, 
    results: resultProps,
  }

  return {
    props: {
      postsPagination: postsResponse
    },
    revalidate: 24 * 60 * 60 // 24 hours 
  }
};
