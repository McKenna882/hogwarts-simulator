import client from './client';

export const authApi = {
  register(email: string, password: string, referralCode?: string) {
    return client.post('/auth/register', { email, password, referralCode });
  },
  login(email: string, password: string) {
    return client.post('/auth/login', { email, password });
  },
  refresh(refreshToken: string) {
    return client.post('/auth/refresh', { refreshToken });
  },
  forgotPassword(email: string) {
    return client.post('/auth/forgot-password', { email });
  },
  resetPassword(token: string, password: string) {
    return client.post('/auth/reset-password', { token, password });
  },
};

export const usersApi = {
  getProfile() { return client.get('/users/profile'); },
  updateProfile(data: Record<string, unknown>) { return client.put('/users/profile', data); },
};

export const chatApi = {
  getCharacters() { return client.get('/characters'); },
  getCharacter(id: string) { return client.get(`/characters/${id}`); },
  getConversations() { return client.get('/chat/conversations'); },
  createConversation(characterId: string) { return client.post('/chat/conversations', { characterId }); },
  getMessages(conversationId: string, page = 1) { return client.get(`/chat/conversations/${conversationId}/messages`, { params: { page } }); },
  sendMessage(conversationId: string, content: string) { return client.post(`/chat/conversations/${conversationId}/messages`, { content }); },
  getAffinities() { return client.get('/chat/affinities'); },
};

export const walletApi = {
  getWallet() { return client.get('/wallet'); },
  getTransactions(page = 1) { return client.get('/wallet/transactions', { params: { page } }); },
  dailySignIn() { return client.post('/wallet/signin'); },
  checkSignIn() { return client.get('/wallet/signin/check'); },
};

export const rechargeApi = {
  getPackages() { return client.get('/recharge/packages'); },
  createOrder(packageId: string) { return client.post('/recharge/orders', { packageId }); },
  virtualPay(orderNo: string, key: string) {
    return client.post(`/recharge/orders/${orderNo}/virtual-pay`, { key });
  },
};

export const shopApi = {
  getShops() { return client.get('/shop/shops'); },
  getProducts(shopId: string) { return client.get(`/shop/shops/${shopId}/products`); },
  buyProduct(productId: string, quantity = 1) { return client.post('/shop/buy', { productId, quantity }); },
};

export const inventoryApi = {
  getInventory() { return client.get('/inventory'); },
  useItem(id: string) { return client.post(`/inventory/use/${id}`); },
};

export const postsApi = {
  getPosts(page = 1) { return client.get('/posts', { params: { page } }); },
  createPost(content: string, imageUrl?: string) { return client.post('/posts', { content, imageUrl }); },
  deletePost(id: string) { return client.delete(`/posts/${id}`); },
  toggleLike(id: string) { return client.post(`/posts/${id}/like`); },
  getComments(id: string) { return client.get(`/posts/${id}/comments`); },
  addComment(id: string, content: string) { return client.post(`/posts/${id}/comments`, { content }); },
};

export const tasksApi = {
  getDailyTasks() { return client.get('/tasks/daily'); },
  updateProgress(taskId: string) { return client.post(`/tasks/${taskId}/progress`); },
  claimReward(taskId: string) { return client.post(`/tasks/${taskId}/claim`); },
};

export const houseCupApi = {
  getStandings() { return client.get('/house-cup'); },
  getLogs(house?: string) { return client.get('/house-cup/logs', { params: { house } }); },
  getQuizzes() { return client.get('/house-cup/quizzes'); },
  submitQuiz(quizId: string, answer: string) { return client.post(`/house-cup/quizzes/${quizId}/submit`, { answer }); },

  // 学院杯每日10题
  getQuizQuestions() { return client.get('/house-cup/quiz/questions'); },
  submitQuizResult(house: string, correctCount: number) { return client.post('/house-cup/quiz/submit', { house, correctCount }); },
  checkQuizToday() { return client.get('/house-cup/quiz/today'); },

  // 布告栏
  getBulletin() { return client.get('/house-cup/bulletin'); },
  claimBulletin(difficulty: string) { return client.post('/house-cup/bulletin/claim', { difficulty }); },

  // 分院锁定
  lockHouse() { return client.post('/house-cup/lock-house'); },

  // 魁地奇
  quidditchWin(house: string) { return client.post('/house-cup/quidditch/win', { house }); },
};

export const roomApi = {
  getStatus() { return client.get('/room'); },
  updateProgress(route: string) { return client.post(`/room/progress/${route}`); },
};

export const petsApi = {
  getPets() { return client.get('/pets'); },
  hatchEgg(inventoryId: string, name?: string) { return client.post('/pets/hatch', { inventoryId, name }); },
  feedPet(petId: string, foodInventoryId: string) { return client.post(`/pets/${petId}/feed`, { foodInventoryId }); },
  growPet(petId: string) { return client.post(`/pets/${petId}/grow`); },
};
