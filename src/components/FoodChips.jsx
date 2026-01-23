import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// 分类数据结构
const FOOD_CATEGORIES = {
  '正餐': ['川湘菜', '粤菜', '江浙菜', '西北菜'],
  '异域': ['日料', '韩餐', '西餐', '意餐', '泰餐'],
  '轻食': ['沙拉', '三明治', '减脂餐'],
  '快餐夜宵': ['汉堡', '麻辣烫', '烧烤', '火锅'],
  '甜品饮品': ['奶茶', '咖啡', '蛋糕'],
}

const CATEGORY_META = {
  '正餐': { icon: '🍚', hint: '吃饱吃爽' },
  '异域': { icon: '🌍', hint: '换个口味' },
  '轻食': { icon: '🥗', hint: '轻负担' },
  '快餐夜宵': { icon: '🌙', hint: '解馋' },
  '甜品饮品': { icon: '🧋', hint: '甜一下' },
}

function FoodChips({ selectedFoods, onSelectionChange }) {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState('正餐')

  const toggleFood = (food) => {
    if (selectedFoods.includes(food)) {
      onSelectionChange(selectedFoods.filter((f) => f !== food))
    } else {
      onSelectionChange([...selectedFoods, food])
    }
  }

  return (
    <div>
      {/* 分类标签 */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 touch-pan-x">
          {Object.keys(FOOD_CATEGORIES).map((category) => {
            const isActive = activeCategory === category
            const meta = CATEGORY_META[category] || { icon: '🍽️', hint: '' }
            return (
              <motion.button
                key={category}
                onClick={() => setActiveCategory(category)}
                whileTap={{ scale: 0.98 }}
                className={`flex-shrink-0 min-h-[44px] px-4 py-2 rounded-[18px] border transition-all active:scale-95 ${
                  isActive
                    ? 'bg-apple-text text-white border-apple-text shadow-sm'
                    : 'bg-white text-apple-text border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.icon}</span>
                  <div className="text-left leading-tight">
                    <div className="text-sm font-semibold">{t(`foods.categories.${category}`)}</div>
                    <div className={`text-[11px] ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                      {t(`foods.hints.${category}`)}
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* 食物选项 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {FOOD_CATEGORIES[activeCategory].map((food, index) => {
          const isSelected = selectedFoods.includes(food)
          return (
            <motion.button
              key={food}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleFood(food)}
              className={`min-h-[52px] px-4 py-3 rounded-[18px] text-base font-semibold transition-all duration-200 touch-manipulation active:scale-95 border ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md border-white/0'
                  : 'bg-white text-apple-text hover:bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{t(`foods.cuisines.${food}`)}</span>
                <span className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                  {isSelected ? '✓' : '+'}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* 已选标签显示 */}
      {selectedFoods.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-2">{t('foods.selected')}</p>
          <div className="flex flex-wrap gap-2">
            {selectedFoods.map((food) => (
              <motion.span
                key={food}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-3 py-1.5 bg-apple-text text-white rounded-full text-sm"
              >
                {t(`foods.cuisines.${food}`)}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FoodChips
