import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Coleção de cartões no Firestore
const CARDS_COLLECTION = 'cards';

export const cardService = {
  // Verificar se o usuário pode criar mais cartões (limite de 3)
  async canCreateCard(userId) {
    try {
      const result = await this.getUserCards(userId);
      if (result.success) {
        return result.data.length < 3;
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar limite de cartões:', error);
      return false;
    }
  },

  // Obter número de cartões do usuário
  async getUserCardCount(userId) {
    try {
      const result = await this.getUserCards(userId);
      if (result.success) {
        return result.data.length;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao contar cartões do usuário:', error);
      return 0;
    }
  },

  // Salvar/Atualizar cartão
  async saveCard(userId, cardId, cardData) {
    try {
      console.log('Salvando cartão:', { userId, cardId, isEditing: !!cardData.createdAt });
      
      // Verificar se é uma criação de novo cartão (não tem createdAt ou createdAt é string recente)
      const isNewCard = !cardData.createdAt || 
        (typeof cardData.createdAt === 'string' && 
         new Date(cardData.createdAt) > new Date(Date.now() - 60000)); // Criado há menos de 1 minuto
      
      if (isNewCard) {
        console.log('Verificando limite para novo cartão...');
        // Verificar limite antes de criar novo cartão
        const canCreate = await this.canCreateCard(userId);
        if (!canCreate) {
          throw new Error('Limite de 3 cartões por conta atingido. Exclua um cartão existente para criar um novo.');
        }
        console.log('Limite OK, pode criar novo cartão');
      } else {
        console.log('Atualizando cartão existente');
      }

      const cardRef = doc(db, CARDS_COLLECTION, `${userId}_${cardId}`);
      
      const dataToSave = {
        ...cardData,
        cardId,
        userId,
        updatedAt: serverTimestamp(),
        createdAt: cardData.createdAt || serverTimestamp()
      };

      console.log('Dados a serem salvos:', dataToSave);
      await setDoc(cardRef, dataToSave, { merge: true });
      
      console.log('Cartão salvo no Firestore com sucesso:', cardId);
      return { success: true };
    } catch (error) {
      console.error('Erro detalhado ao salvar cartão:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      throw new Error(error.message || 'Erro ao salvar cartão no banco de dados');
    }
  },

  // Buscar cartão específico
  async getCard(userId, cardId) {
    try {
      const cardRef = doc(db, CARDS_COLLECTION, `${userId}_${cardId}`);
      const cardSnap = await getDoc(cardRef);

      if (cardSnap.exists()) {
        return {
          success: true,
          data: cardSnap.data()
        };
      } else {
        return {
          success: false,
          error: 'Cartão não encontrado'
        };
      }
    } catch (error) {
      console.error('Erro ao buscar cartão:', error);
      throw new Error('Erro ao buscar cartão no banco de dados');
    }
  },

  // Buscar cartão por ID (para páginas públicas)
  async getPublicCard(cardId) {
    try {
      // Primeiro tenta buscar com query (para compatibilidade)
      const cardsRef = collection(db, CARDS_COLLECTION);
      const q = query(cardsRef, where('cardId', '==', cardId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        // Verifica se o cartão está configurado (para segurança extra)
        if (data.isConfigured) {
          return {
            success: true,
            data: data
          };
        } else {
          return {
            success: false,
            error: 'Cartão não configurado'
          };
        }
      } else {
        return {
          success: false,
          error: 'Cartão não encontrado'
        };
      }
    } catch (error) {
      console.error('Erro ao buscar cartão público:', error);
      console.error('Detalhes do erro:', error.code, error.message);
      throw new Error('Erro ao buscar cartão');
    }
  },

  // Buscar todos os cartões do usuário
  async getUserCards(userId) {
    try {
      const cardsRef = collection(db, CARDS_COLLECTION);
      const q = query(
        cardsRef, 
        where('userId', '==', userId)
        // orderBy('createdAt', 'desc') // Temporariamente removido até criar índice
      );
      
      const querySnapshot = await getDocs(q);
      const cards = [];
      
      querySnapshot.forEach((doc) => {
        cards.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        data: cards
      };
    } catch (error) {
      console.error('Erro ao buscar cartões do usuário:', error);
      throw new Error('Erro ao buscar cartões do usuário');
    }
  },

  // Excluir cartão
  async deleteCard(userId, cardId) {
    try {
      if (!userId || !cardId) {
        throw new Error('UserId e CardId são obrigatórios para exclusão');
      }

      const docId = `${userId}_${cardId}`;
      console.log('Tentando excluir documento:', docId);
      
      const cardRef = doc(db, CARDS_COLLECTION, docId);
      
      // Verificar se o documento existe antes de tentar excluir
      const docSnap = await getDoc(cardRef);
      if (!docSnap.exists()) {
        console.log('Documento não encontrado, pode já ter sido excluído');
        return { success: true, message: 'Documento não encontrado (pode já ter sido excluído)' };
      }
      
      await deleteDoc(cardRef);
      
      console.log('Cartão excluído com sucesso:', cardId);
      return { success: true };
    } catch (error) {
      console.error('Erro detalhado ao excluir cartão:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      throw new Error(`Erro ao excluir cartão: ${error.message}`);
    }
  },

  // Verificar se cartão existe
  async cardExists(cardId) {
    try {
      const cardsRef = collection(db, CARDS_COLLECTION);
      const q = query(cardsRef, where('cardId', '==', cardId));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erro ao verificar existência do cartão:', error);
      return false;
    }
  },

  // Gerar ID único para cartão
  generateCardId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  },

  // Migrar dados do localStorage para Firestore
  async migrateLocalStorageData(userId) {
    try {
      const migratedCards = [];
      
      // Buscar todos os cartões no localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('card_')) {
          try {
            const cardData = JSON.parse(localStorage.getItem(key));
            if (cardData && cardData.isConfigured) {
              const cardId = key.replace('card_', '');
              
              // Salvar no Firestore
              await this.saveCard(userId, cardId, cardData);
              migratedCards.push(cardId);
              
              // Remover do localStorage após migração bem-sucedida
              localStorage.removeItem(key);
            }
          } catch (error) {
            console.error(`Erro ao migrar cartão ${key}:`, error);
          }
        }
      }
      
      console.log(`${migratedCards.length} cartões migrados para Firestore`);
      return { success: true, migratedCount: migratedCards.length };
    } catch (error) {
      console.error('Erro na migração:', error);
      throw new Error('Erro ao migrar dados');
    }
  }
}; 