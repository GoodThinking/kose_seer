<template>
  <div class="default-player-page space-y-6">
    <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
          <el-icon :size="24" color="white"><User /></el-icon>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">默认玩家数据配置</h3>
          <p class="text-sm text-gray-600">
            配置新注册玩家的初始数据，包括初始金币、体力、地图位置等。修改后需保存并重载配置。
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

    <div v-if="loaded" class="grid grid-cols-2 gap-6">
      <!-- 玩家基础数据 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-gray-900 px-6 py-4">
          <h3 class="text-lg font-semibold text-white">玩家基础数据</h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="config-group">
            <div class="config-group-title">资源</div>
            <div class="config-row">
              <label>初始金币</label>
              <el-input-number v-model="config.player.coins" :min="0" :step="1000" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>初始体力</label>
              <el-input-number v-model="config.player.energy" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>可分配经验</label>
              <el-input-number v-model="config.player.allocatableExp" :min="0" :step="1000" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>战斗徽章</label>
              <el-input-number v-model="config.player.fightBadge" :min="0" controls-position="right" style="width: 200px" />
            </div>
          </div>

          <div class="config-group">
            <div class="config-group-title">地图位置</div>
            <div class="config-row">
              <label>初始地图ID</label>
              <el-input-number v-model="config.player.mapId" :min="1" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>坐标 X</label>
              <el-input-number v-model="config.player.posX" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>坐标 Y</label>
              <el-input-number v-model="config.player.posY" :min="0" controls-position="right" style="width: 200px" />
            </div>
          </div>

          <div class="config-group">
            <div class="config-group-title">限制</div>
            <div class="config-row">
              <label>每日在线时间</label>
              <el-input-number v-model="config.player.timeToday" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>时间限制(秒)</label>
              <el-input-number v-model="config.player.timeLimit" :min="0" :step="3600" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>精灵最高等级</label>
              <el-input-number v-model="config.player.petMaxLev" :min="1" controls-position="right" style="width: 200px" />
            </div>
          </div>

          <div class="config-group">
            <div class="config-group-title">其他</div>
            <div class="config-row">
              <label>登录次数</label>
              <el-input-number v-model="config.player.loginCnt" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>邀请者ID</label>
              <el-input-number v-model="config.player.inviter" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>精灵总数</label>
              <el-input-number v-model="config.player.petAllNum" :min="0" controls-position="right" style="width: 200px" />
            </div>
          </div>

          <div class="config-group">
            <div class="config-group-title">VIP</div>
            <div class="config-row">
              <label>VIP等级</label>
              <el-input-number v-model="config.player.vipLevel" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>VIP值</label>
              <el-input-number v-model="config.player.vipValue" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>VIP阶段</label>
              <el-input-number v-model="config.player.vipStage" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>VIP结束时间</label>
              <el-input-number v-model="config.player.vipEndTime" :min="0" controls-position="right" style="width: 200px" />
            </div>
          </div>

          <div class="config-group">
            <div class="config-group-title">战斗统计</div>
            <div class="config-row">
              <label>王者之战胜利</label>
              <el-input-number v-model="config.player.monKingWin" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>混战胜利</label>
              <el-input-number v-model="config.player.messWin" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>最高竞技场连胜</label>
              <el-input-number v-model="config.player.maxArenaWins" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>当前关卡</label>
              <el-input-number v-model="config.player.curStage" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>最高关卡</label>
              <el-input-number v-model="config.player.maxStage" :min="0" controls-position="right" style="width: 200px" />
            </div>
          </div>

          <div class="config-group">
            <div class="config-group-title">师徒</div>
            <div class="config-row">
              <label>老师ID</label>
              <el-input-number v-model="config.player.teacherId" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>学生ID</label>
              <el-input-number v-model="config.player.studentId" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>毕业次数</label>
              <el-input-number v-model="config.player.graduationCount" :min="0" controls-position="right" style="width: 200px" />
            </div>
          </div>
        </div>
      </div>

      <!-- NoNo数据 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="bg-gray-900 px-6 py-4">
          <h3 class="text-lg font-semibold text-white">NoNo 数据</h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="config-group">
            <div class="config-group-title">基础</div>
            <div class="config-row">
              <label>拥有NoNo</label>
              <el-select v-model="config.nono.hasNono" style="width: 200px">
                <el-option :value="0" label="否" />
                <el-option :value="1" label="是" />
              </el-select>
            </div>
            <div class="config-row">
              <label>超级NoNo</label>
              <el-select v-model="config.nono.superNono" style="width: 200px">
                <el-option :value="0" label="否" />
                <el-option :value="1" label="是" />
              </el-select>
            </div>
            <div class="config-row">
              <label>NoNo状态</label>
              <el-input-number v-model="config.nono.nonoState" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>NoNo颜色</label>
              <el-input-number v-model="config.nono.nonoColor" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>NoNo昵称</label>
              <el-input v-model="config.nono.nonoNick" placeholder="NoNo昵称" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>NoNo标志</label>
              <el-input-number v-model="config.nono.nonoFlag" :min="0" controls-position="right" style="width: 200px" />
            </div>
          </div>

          <div class="config-group">
            <div class="config-group-title">属性</div>
            <div class="config-row">
              <label>体力</label>
              <el-input-number v-model="config.nono.nonoPower" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>心情</label>
              <el-input-number v-model="config.nono.nonoMate" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>智商</label>
              <el-input-number v-model="config.nono.nonoIq" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>AI</label>
              <el-input-number v-model="config.nono.nonoAi" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>出生时间</label>
              <el-input-number v-model="config.nono.nonoBirth" :min="0" controls-position="right" style="width: 200px" />
            </div>
          </div>

          <div class="config-group">
            <div class="config-group-title">超能</div>
            <div class="config-row">
              <label>充能时间</label>
              <el-input-number v-model="config.nono.nonoChargeTime" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>超能能量</label>
              <el-input-number v-model="config.nono.nonoSuperEnergy" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>超能等级</label>
              <el-input-number v-model="config.nono.nonoSuperLevel" :min="0" controls-position="right" style="width: 200px" />
            </div>
            <div class="config-row">
              <label>超能阶段</label>
              <el-input-number v-model="config.nono.nonoSuperStage" :min="0" controls-position="right" style="width: 200px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Upload, Refresh } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()
const saving = ref(false)
const loaded = ref(false)

const config = ref<any>({
  description: '新玩家默认配置',
  player: {},
  nono: {}
})

const loadData = async () => {
  try {
    const data = await configStore.fetchConfig('default-player')
    config.value = data
    loaded.value = true
  } catch (error) {
    ElMessage.error('加载默认玩家配置失败')
  }
}

const handleSave = async () => {
  try {
    saving.value = true
    await configStore.saveConfig('default-player', config.value)
    ElMessage.success('默认玩家配置保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleReload = async () => {
  try {
    await ElMessageBox.confirm('重载配置会立即应用到游戏服务器，确定要继续吗？', '确认重载', { type: 'warning' })
    await configStore.reloadConfig('default-player')
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
.config-group {
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.config-group-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.config-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.config-row:last-child {
  border-bottom: none;
}

.config-row label {
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
}
</style>
