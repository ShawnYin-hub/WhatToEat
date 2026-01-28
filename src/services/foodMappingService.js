/**
 * 菜品名称到地图API关键词和类型的映射服务
 * 确保用户选择的菜品能准确匹配到搜索结果
 */

/**
 * 菜品到搜索关键词的映射（用于地图API搜索）
 * 这些关键词是地图API能够准确识别的
 */
export const FOOD_TO_KEYWORDS = {
  // 正餐类 - 只保留可以准确匹配的
  '川湘菜': ['川菜', '湘菜', '川湘菜'],
  '粤菜': ['粤菜', '广东菜', '港式茶餐厅'],
  '江浙菜': ['江浙菜', '本帮菜', '上海菜', '苏帮菜'],
  '西北菜': ['西北菜', '陕西菜', '新疆菜', '兰州拉面'],
  
  // 异域类 - 只保留可以准确匹配的
  '日料': ['日本料理', '日式料理', '日料', '寿司', '日式餐厅'],
  '韩餐': ['韩国料理', '韩式料理', '韩餐', '韩国菜'],
  '西餐': ['西餐厅', '西餐', '牛排', '西式餐厅'],
  '意餐': ['意大利餐厅', '意式餐厅', '意大利菜'],
  '泰餐': ['泰国菜', '泰式餐厅', '泰餐'],
  
  // 轻食类 - 只保留可以准确匹配的
  '沙拉': ['沙拉', '轻食', '健康餐'],
  '三明治': ['三明治', '三文治', '轻食'],
  
  // 快餐夜宵类 - 只保留可以准确匹配的
  '汉堡': ['汉堡', '汉堡店', '快餐'],
  '麻辣烫': ['麻辣烫', '串串香'],
  '烧烤': ['烧烤', '烤肉', '烤串'],
  '火锅': ['火锅', '重庆火锅', '四川火锅'],
  
  // 甜品饮品类 - 只保留可以准确匹配的
  '奶茶': ['奶茶', '茶饮', '饮品店'],
  '咖啡': ['咖啡', '咖啡厅', '咖啡店'],
  '蛋糕': ['蛋糕', '甜品', '甜品店'],
}

/**
 * 菜品到地图API类型代码的映射（高德地图）
 * 高德地图餐饮服务分类码：050000
 * 子分类：
 * - 050100: 中餐厅
 * - 050200: 外国餐厅
 * - 050300: 快餐厅
 * - 050400: 休闲餐饮场所
 * - 050500: 咖啡厅
 * - 050600: 茶艺馆
 * - 050700: 冷饮店
 * - 050800: 糕饼店
 */
export const FOOD_TO_TYPES = {
  // 正餐类
  '川湘菜': '050100', // 中餐厅
  '粤菜': '050100', // 中餐厅
  '江浙菜': '050100', // 中餐厅
  '西北菜': '050100', // 中餐厅
  
  // 异域类
  '日料': '050200', // 外国餐厅
  '韩餐': '050200', // 外国餐厅
  '西餐': '050200', // 外国餐厅
  '意餐': '050200', // 外国餐厅
  '泰餐': '050200', // 外国餐厅
  
  // 轻食类
  '沙拉': '050400', // 休闲餐饮场所
  '三明治': '050300', // 快餐厅
  
  // 快餐夜宵类
  '汉堡': '050300', // 快餐厅
  '麻辣烫': '050100', // 中餐厅
  '烧烤': '050100', // 中餐厅
  '火锅': '050100', // 中餐厅
  
  // 甜品饮品类
  '奶茶': '050700', // 冷饮店
  '咖啡': '050500', // 咖啡厅
  '蛋糕': '050800', // 糕饼店
}

/**
 * 检查餐厅是否匹配用户选择的菜品
 * @param {Object} restaurant - 餐厅对象
 * @param {string[]} selectedFoods - 用户选择的菜品列表
 * @returns {boolean} 是否匹配
 */
export function matchesSelectedFoods(restaurant, selectedFoods) {
  if (!selectedFoods || selectedFoods.length === 0) {
    return true // 如果没有选择，则匹配所有
  }

  const restaurantName = (restaurant.name || '').toLowerCase()
  const restaurantType = (restaurant.type || '').toLowerCase()
  const restaurantAddress = (restaurant.address || '').toLowerCase()

  // 检查每个选择的菜品
  for (const food of selectedFoods) {
    const keywords = FOOD_TO_KEYWORDS[food] || []
    
    // 检查餐厅名称、类型或地址中是否包含关键词
    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase()
      if (
        restaurantName.includes(lowerKeyword) ||
        restaurantType.includes(lowerKeyword) ||
        restaurantAddress.includes(lowerKeyword)
      ) {
        return true // 匹配到任何一个关键词就返回true
      }
    }
  }

  return false // 没有匹配到任何关键词
}

/**
 * 过滤餐厅列表，只保留匹配用户选择菜品的餐厅
 * @param {Array} restaurants - 餐厅列表
 * @param {string[]} selectedFoods - 用户选择的菜品列表
 * @returns {Array} 过滤后的餐厅列表
 */
export function filterRestaurantsByFoods(restaurants, selectedFoods) {
  if (!selectedFoods || selectedFoods.length === 0) {
    return restaurants // 如果没有选择，返回所有餐厅
  }

  return restaurants.filter((restaurant) => matchesSelectedFoods(restaurant, selectedFoods))
}

/**
 * 获取菜品对应的搜索关键词（用于地图API）
 * @param {string[]} selectedFoods - 用户选择的菜品列表
 * @returns {string[]} 搜索关键词列表
 */
export function getSearchKeywords(selectedFoods) {
  if (!selectedFoods || selectedFoods.length === 0) {
    return []
  }

  const keywords = new Set()
  selectedFoods.forEach((food) => {
    const foodKeywords = FOOD_TO_KEYWORDS[food] || []
    foodKeywords.forEach((kw) => keywords.add(kw))
  })

  return Array.from(keywords)
}

/**
 * 获取菜品对应的类型代码（用于地图API）
 * @param {string[]} selectedFoods - 用户选择的菜品列表
 * @returns {string} 类型代码（高德地图格式）
 */
export function getTypeCode(selectedFoods) {
  if (!selectedFoods || selectedFoods.length === 0) {
    return '050000' // 默认：所有餐饮服务
  }

  // 如果选择了多个菜品，优先使用第一个的类型代码
  // 或者可以返回多个类型代码的组合
  const firstFood = selectedFoods[0]
  return FOOD_TO_TYPES[firstFood] || '050000'
}
