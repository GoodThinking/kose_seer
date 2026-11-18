<template>
  <div class="tasks-page space-y-6">
    <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
          <el-icon :size="24" color="white"><Document /></el-icon>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">任务配置</h3>
          <p class="text-sm text-gray-600">
            配置游戏任务的奖励、完成条件等信息。支持添加、编辑、删除任务，修改后需保存并重载配置。
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
        <h3 class="text-lg font-semibold text-white">任务列表 ({{ taskList.length }})</h3>
        <div class="flex gap-2">
          <el-input
            v-model="searchText"
            placeholder="搜索任务ID或名称"
            style="width: 250px"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button @click="handleAddTask">
            <el-icon><Plus /></el-icon>
            添加任务
          </el-button>
        </div>
      </div>

      <div class="p-6">
        <el-table :data="filteredTasks" border stripe max-height="calc(100vh - 380px)">
          <el-table-column prop="id" label="任务ID" width="100" sortable />
          <el-table-column prop="name" label="任务名称" width="180" />
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)" size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="奖励" min-width="300">
            <template #default="{ row }">
              <div class="reward-summary">
                <el-tag v-if="row.rewards?.coins" size="small" type="warning" style="margin-right: 4px;">
                  金币: {{ row.rewards.coins }}
                </el-tag>
                <el-tag v-if="row.rewards?.items?.length" size="small" style="margin-right: 4px;">
                  物品x{{ row.rewards.items.length }}
                </el-tag>
                <el-tag v-if="row.rewards?.special?.length" size="small" type="success" style="margin-right: 4px;">
                  特殊x{{ row.rewards.special.length }}
                </el-tag>
                <el-tag v-if="row.paramMap" size="small" type="info">
                  参数映射
                </el-tag>
                <el-tag v-if="row.targetItemId" size="small" type="info">
                  目标物品: {{ row.targetItemId }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row, $index }">
              <el-button size="small" @click="handleEditTask(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteTask($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 编辑任务对话框 -->
    <el-dialog v-model="editDialog" :title="isNewTask ? '添加任务' : '编辑任务'" width="800px">
      <el-form :model="editForm" label-width="100px" class="task-edit-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="任务ID">
              <el-input-number v-model="editForm.id" :min="1" :disabled="!isNewTask" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="任务名称">
              <el-input v-model="editForm.name" placeholder="任务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="类型">
              <el-select v-model="editForm.type" style="width: 100%">
                <el-option value="normal" label="普通任务" />
                <el-option value="select_pet" label="选择精灵" />
                <el-option value="get_item" label="获取物品" />
                <el-option value="daily" label="每日任务" />
                <el-option value="weekly" label="每周任务" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 目标物品ID（get_item类型） -->
        <el-form-item v-if="editForm.type === 'get_item'" label="目标物品ID">
          <el-input-number v-model="editForm.targetItemId" :min="0" style="width: 200px" controls-position="right" />
        </el-form-item>

        <!-- 参数映射（select_pet类型） -->
        <div v-if="editForm.type === 'select_pet'" class="form-section">
          <div class="section-title">参数映射</div>
          <div v-for="(value, key) in editForm.paramMap" :key="key" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
            <el-input :model-value="key" disabled style="width: 80px" size="small" />
            <span style="color: #6b7280;">→</span>
            <el-input-number :model-value="value" @update:model-value="(v: number) => editForm.paramMap[key] = v" :min="0" size="small" style="width: 150px" controls-position="right" />
            <el-button size="small" type="danger" @click="delete editForm.paramMap[key]">删除</el-button>
          </div>
          <el-button size="small" @click="addParamMapEntry">添加映射</el-button>
        </div>

        <!-- 奖励配置 -->
        <div v-if="editForm.type !== 'select_pet'" class="form-section">
          <div class="section-title">奖励配置</div>
          <el-form-item label="金币奖励">
            <el-input-number v-model="editForm.rewards.coins" :min="0" style="width: 200px" controls-position="right" />
          </el-form-item>

          <!-- 物品奖励 -->
          <div style="margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px;">物品奖励</div>
            <div v-for="(item, index) in editForm.rewards.items" :key="index" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
              <el-input-number v-model="item.id" :min="1" placeholder="物品ID" size="small" style="width: 150px" controls-position="right" />
              <span style="color: #6b7280;">x</span>
              <el-input-number v-model="item.count" :min="1" placeholder="数量" size="small" style="width: 100px" controls-position="right" />
              <el-button size="small" type="danger" @click="editForm.rewards.items.splice(index, 1)">删除</el-button>
            </div>
            <el-button size="small" @click="editForm.rewards.items.push({ id: 0, count: 1 })">添加物品</el-button>
          </div>

          <!-- 特殊奖励 -->
          <div>
            <div style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px;">特殊奖励</div>
            <div v-for="(sp, index) in editForm.rewards.special" :key="index" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
              <el-select v-model="sp.type" size="small" style="width: 150px" placeholder="类型">
                <el-option :value="1" label="1 - 金币" />
                <el-option :value="3" label="3 - 经验" />
                <el-option :value="5" label="5 - 体力" />
              </el-select>
              <el-input-number v-model="sp.value" :min="0" placeholder="数值" size="small" style="width: 150px" controls-position="right" />
              <el-button size="small" type="danger" @click="editForm.rewards.special.splice(index, 1)">删除</el-button>
            </div>
            <el-button size="small" @click="editForm.rewards.special.push({ type: 1, value: 0 })">添加特殊奖励</el-button>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="editDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEditTask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Upload, Refresh, Search, Plus } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()
const saving = ref(false)
const searchText = ref('')
const editDialog = ref(false)
const isNewTask = ref(false)

// 原始配置数据
const rawConfig = ref<any>({})
const taskList = ref<any[]>([])

// 编辑表单
const editForm = ref<any>({
  id: 0,
  name: '',
  type: 'normal',
  targetItemId: 0,
  paramMap: {} as Record<string, number>,
  rewards: {
    coins: 0,
    items: [] as Array<{ id: number; count: number }>,
    special: [] as Array<{ type: number; value: number }>
  }
})

const filteredTasks = computed(() => {
  if (!searchText.value) return taskList.value
  const q = searchText.value.toLowerCase()
  return taskList.value.filter(t =>
    t.id.toString().includes(q) || t.name.toLowerCase().includes(q)
  )
})

const getTypeTagType = (type: string) => {
  const map: Record<string, string> = {
    normal: '', select_pet: 'success', get_item: 'warning', daily: 'info', weekly: 'danger'
  }
  return map[type] || 'info'
}

const loadData = async () => {
  try {
    const data = await configStore.fetchConfig('tasks')
    rawConfig.value = data
    // 将 tasks 对象转为数组
    const tasks = data.tasks || {}
    taskList.value = Object.entries(tasks).map(([id, task]: [string, any]) => ({
      id: parseInt(id),
      ...task
    })).sort((a, b) => a.id - b.id)
  } catch (error) {
    ElMessage.error('加载任务配置失败')
  }
}

const handleAddTask = () => {
  isNewTask.value = true
  const maxId = taskList.value.length > 0 ? Math.max(...taskList.value.map(t => t.id)) : 0
  editForm.value = {
    id: maxId + 1,
    name: '',
    type: 'normal',
    targetItemId: 0,
    paramMap: {},
    rewards: { coins: 0, items: [], special: [] }
  }
  editDialog.value = true
}

const handleEditTask = (task: any) => {
  isNewTask.value = false
  editForm.value = JSON.parse(JSON.stringify({
    id: task.id,
    name: task.name || '',
    type: task.type || 'normal',
    targetItemId: task.targetItemId || 0,
    paramMap: task.paramMap || {},
    rewards: {
      coins: task.rewards?.coins || 0,
      items: task.rewards?.items || [],
      special: task.rewards?.special || []
    }
  }))
  editDialog.value = true
}

const handleDeleteTask = async (index: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个任务吗？', '提示', { type: 'warning' })
    taskList.value.splice(index, 1)
    ElMessage.success('已删除，请保存配置')
  } catch {}
}

const confirmEditTask = () => {
  if (!editForm.value.name) {
    ElMessage.warning('请输入任务名称')
    return
  }

  const taskData: any = {
    id: editForm.value.id,
    name: editForm.value.name,
    type: editForm.value.type
  }

  if (editForm.value.type === 'get_item' && editForm.value.targetItemId > 0) {
    taskData.targetItemId = editForm.value.targetItemId
  }
  if (editForm.value.type === 'select_pet' && Object.keys(editForm.value.paramMap).length > 0) {
    taskData.paramMap = editForm.value.paramMap
  }
  if (editForm.value.type !== 'select_pet') {
    const rewards: any = {}
    if (editForm.value.rewards.coins > 0) rewards.coins = editForm.value.rewards.coins
    if (editForm.value.rewards.items.length > 0) rewards.items = editForm.value.rewards.items.filter((i: any) => i.id > 0)
    if (editForm.value.rewards.special.length > 0) rewards.special = editForm.value.rewards.special
    if (Object.keys(rewards).length > 0) taskData.rewards = rewards
  }

  if (isNewTask.value) {
    taskList.value.push(taskData)
  } else {
    const idx = taskList.value.findIndex(t => t.id === taskData.id)
    if (idx !== -1) taskList.value[idx] = taskData
  }

  taskList.value.sort((a, b) => a.id - b.id)
  editDialog.value = false
  ElMessage.success(isNewTask.value ? '已添加，请保存配置' : '已修改，请保存配置')
}

const addParamMapEntry = () => {
  const keys = Object.keys(editForm.value.paramMap)
  const nextKey = (keys.length + 1).toString()
  editForm.value.paramMap[nextKey] = 0
}

const handleSave = async () => {
  try {
    saving.value = true
    // 将数组转回对象格式
    const tasks: any = {}
    taskList.value.forEach(task => {
      const { id, ...rest } = task
      tasks[id.toString()] = rest
    })
    await configStore.saveConfig('tasks', { tasks })
    ElMessage.success('任务配置保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleReload = async () => {
  try {
    await ElMessageBox.confirm('重载配置会立即应用到游戏服务器，确定要继续吗？', '确认重载', { type: 'warning' })
    await configStore.reloadConfig('tasks')
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
.form-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.task-edit-form {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}
</style>
