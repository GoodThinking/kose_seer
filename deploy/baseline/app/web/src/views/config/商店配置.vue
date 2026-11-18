<template>
  <div class="shop-page space-y-6">
    <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
          <el-icon :size="24" color="white"><ShoppingCart /></el-icon>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">商店配置</h3>
          <p class="text-sm text-gray-600">
            配置游戏商店的商品列表，包括商品ID、价格、VIP折扣、赠送金币等。修改后需保存并重载配置。
          </p>
        </div>
        <div class="flex gap-2">
          <el-button type="primary" @click="handleSave" :loading="saving">
            <el-icon><Upload /></el-icon>
            保存配置
          </el-button>
          <el-button type="success" @click="handleReload">
            <el-icon><Refresh /></el-icon>
            重载配置
          </el-button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="bg-gray-900 px-6 py-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">商品列表 ({{ products.length }})</h3>
        <div class="flex gap-2">
          <el-input
            v-model="searchText"
            placeholder="搜索商品ID或描述"
            style="width: 250px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button @click="handleAddProduct">
            <el-icon><Plus /></el-icon>
            添加商品
          </el-button>
        </div>
      </div>

      <div class="p-6">
        <el-table :data="filteredProducts" border stripe max-height="calc(100vh - 380px)">
          <el-table-column prop="productID" label="商品ID" width="120" sortable />
          <el-table-column prop="itemID" label="物品ID" width="120">
            <template #default="{ row }">
              <span>{{ row.itemID }}</span>
              <span v-if="getItemName(row.itemID)" class="text-xs text-gray-500 ml-1">({{ getItemName(row.itemID) }})</span>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="价格" width="120" align="right">
            <template #default="{ row }">
              <span class="font-mono">{{ row.price?.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="vip" label="VIP折扣" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.vip < 1" type="warning" size="small">{{ (row.vip * 10).toFixed(0) }}折</el-tag>
              <span v-else class="text-gray-400">无</span>
            </template>
          </el-table-column>
          <el-table-column prop="gold" label="赠送金币" width="120" align="right">
            <template #default="{ row }">
              <span v-if="row.gold > 0" class="font-mono text-yellow-600">+{{ row.gold }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="250" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row, $index }">
              <el-button size="small" @click="handleEditProduct(row, $index)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteProduct($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 编辑商品对话框 -->
    <el-dialog v-model="editDialog" :title="isNewProduct ? '添加商品' : '编辑商品'" width="600px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="商品ID">
          <el-input-number v-model="editForm.productID" :min="1" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="物品ID">
          <el-input-number v-model="editForm.itemID" :min="1" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="editForm.price" :min="0" :step="100" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="VIP折扣">
          <el-input-number v-model="editForm.vip" :min="0" :max="1" :step="0.1" :precision="2" style="width: 100%" controls-position="right" />
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            0.8 = 8折, 0.7 = 7折, 1.0 = 无折扣
          </div>
        </el-form-item>
        <el-form-item label="赠送金币">
          <el-input-number v-model="editForm.gold" :min="0" :step="10" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="2" placeholder="商品描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEditProduct">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ShoppingCart, Upload, Refresh, Search, Plus } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()
const saving = ref(false)
const searchText = ref('')
const editDialog = ref(false)
const isNewProduct = ref(false)
const editIndex = ref(-1)

const products = ref<any[]>([])

const editForm = ref({
  productID: 0,
  itemID: 0,
  price: 0,
  vip: 1.0,
  gold: 0,
  description: ''
})

const filteredProducts = computed(() => {
  if (!searchText.value) return products.value
  const q = searchText.value.toLowerCase()
  return products.value.filter(p =>
    p.productID?.toString().includes(q) ||
    p.itemID?.toString().includes(q) ||
    p.description?.toLowerCase().includes(q)
  )
})

const getItemName = (itemId: number) => {
  return configStore.itemNames[itemId] || ''
}

const loadData = async () => {
  try {
    await configStore.fetchItemNames()
    const data = await configStore.fetchConfig('shop')
    products.value = data.products || []
  } catch (error) {
    ElMessage.error('加载商店配置失败')
  }
}

const handleAddProduct = () => {
  isNewProduct.value = true
  editIndex.value = -1
  const maxId = products.value.length > 0 ? Math.max(...products.value.map(p => p.productID || 0)) : 240000
  editForm.value = {
    productID: maxId + 1,
    itemID: 0,
    price: 100,
    vip: 1.0,
    gold: 0,
    description: ''
  }
  editDialog.value = true
}

const handleEditProduct = (product: any, index: number) => {
  isNewProduct.value = false
  editIndex.value = index
  editForm.value = JSON.parse(JSON.stringify(product))
  editDialog.value = true
}

const handleDeleteProduct = async (index: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个商品吗？', '提示', { type: 'warning' })
    products.value.splice(index, 1)
    ElMessage.success('已删除，请保存配置')
  } catch {}
}

const confirmEditProduct = () => {
  if (!editForm.value.productID || !editForm.value.itemID) {
    ElMessage.warning('请填写商品ID和物品ID')
    return
  }

  const productData = JSON.parse(JSON.stringify(editForm.value))

  if (isNewProduct.value) {
    products.value.push(productData)
  } else if (editIndex.value >= 0) {
    products.value[editIndex.value] = productData
  }

  editDialog.value = false
  ElMessage.success(isNewProduct.value ? '已添加，请保存配置' : '已修改，请保存配置')
}

const handleSave = async () => {
  try {
    saving.value = true
    await configStore.saveConfig('shop', { products: products.value })
    ElMessage.success('商店配置保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleReload = async () => {
  try {
    await ElMessageBox.confirm('重载配置会立即应用到游戏服务器，确定要继续吗？', '确认重载', { type: 'warning' })
    await configStore.reloadConfig('shop')
    ElMessage.success('配置重载成功')
  } catch (error: any) {
    if (error !== 'cancel') ElMessage.error('配置重载失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* 与其他配置页面保持一致的样式 */
</style>
