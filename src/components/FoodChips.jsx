import { motion } from 'framer-motion'

const FOOD_OPTIONS = ['火锅', '快餐', '日料', '川菜', '奶茶']

function FoodChips({ selectedFoods, onSelectionChange }) {
  const toggleFood = (food) => {
    if (selectedFoods.includes(food)) {
      onSelectionChange(selectedFoods.filter((f) => f !== food))
    } else {
      onSelectionChange([...selectedFoods, food])
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {FOOD_OPTIONS.map((food, index) => {
        const isSelected = selectedFoods.includes(food)
        return (
          <motion.button
            key={food}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleFood(food)}
            className={`min-h-[44px] min-w-[44px] px-5 sm:px-6 py-3 rounded-full text-base font-medium transition-all duration-200 touch-manipulation ${
              isSelected
                ? 'bg-apple-text text-white shadow-md'
                : 'bg-gray-100 text-apple-text hover:bg-gray-200 active:bg-gray-300'
            }`}
          >
            {food}
          </motion.button>
        )
      })}
    </div>
  )
}

export default FoodChips
