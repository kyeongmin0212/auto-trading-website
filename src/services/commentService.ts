import { db } from '../firebase/config';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

export interface Comment {
  id?: string;
  postId: string;
  author: string;
  content: string;
  timestamp: any;
}

export const commentService = {
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef, 
        where('postId', '==', postId),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const comments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data()
        } as Comment);
      });
      
      return comments;
    } catch (error) {
      console.error('댓글 조회 오류:', error);
      throw error;
    }
  },

  async createComment(commentData: Omit<Comment, 'id'>): Promise<string> {
    try {
      const commentsRef = collection(db, 'comments');
      const docRef = await addDoc(commentsRef, commentData);
      return docRef.id;
    } catch (error) {
      console.error('댓글 생성 오류:', error);
      throw error;
    }
  },

  async updateComment(id: string, commentData: Partial<Comment>): Promise<void> {
    try {
      const commentRef = doc(db, 'comments', id);
      await updateDoc(commentRef, commentData);
    } catch (error) {
      console.error('댓글 수정 오류:', error);
      throw error;
    }
  },

  async deleteComment(id: string): Promise<void> {
    try {
      const commentRef = doc(db, 'comments', id);
      await deleteDoc(commentRef);
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      throw error;
    }
  }
};
