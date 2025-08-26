import { db } from '../firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit, increment } from 'firebase/firestore';

export interface Post {
  id?: string;
  number: number;
  title: string;
  category: string;
  author: string;
  date: string;
  views: number;
  likes: number;
  content: string;
}

export const postService = {
  async getPosts(): Promise<Post[]> {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const posts: Post[] = [];
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        } as Post);
      });
      
      return posts;
    } catch (error) {
      console.error('게시물 조회 오류:', error);
      throw error;
    }
  },

  async createPost(postData: Omit<Post, 'id'>): Promise<string> {
    try {
      const postsRef = collection(db, 'posts');
      const docRef = await addDoc(postsRef, postData);
      return docRef.id;
    } catch (error) {
      console.error('게시물 생성 오류:', error);
      throw error;
    }
  },

  async updatePost(id: string, postData: Partial<Post>): Promise<void> {
    try {
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, postData);
    } catch (error) {
      console.error('게시물 수정 오류:', error);
      throw error;
    }
  },

  async deletePost(id: string): Promise<void> {
    try {
      const postRef = doc(db, 'posts', id);
      await deleteDoc(postRef);
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      throw error;
    }
  },

  async incrementViews(id: string): Promise<void> {
    try {
      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('조회수 증가 오류:', error);
      throw error;
    }
  }
};


