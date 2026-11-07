package com.shiliao.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shiliao.common.Converters;
import com.shiliao.common.R;
import com.shiliao.dto.Views;
import com.shiliao.entity.ChronicPlan;
import com.shiliao.entity.HealthProfile;
import com.shiliao.entity.MealRecord;
import com.shiliao.repository.ChronicPlanMapper;
import com.shiliao.repository.HealthProfileMapper;
import com.shiliao.repository.MealRecordMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/** 用餐记录、健康档案、慢病方案 */
@Service
public class HealthService {

    public HealthService(MealRecordMapper mealMapper, HealthProfileMapper profileMapper, ChronicPlanMapper planMapper) {
        this.mealMapper = mealMapper;
        this.profileMapper = profileMapper;
        this.planMapper = planMapper;
    }

    private final MealRecordMapper mealMapper;
    private final HealthProfileMapper profileMapper;
    private final ChronicPlanMapper planMapper;

    public R.PageResult<MealRecord> pageMeals(int page, int pageSize, String keyword, String mealType) {
        LambdaQueryWrapper<MealRecord> qw = new LambdaQueryWrapper<MealRecord>()
                .eq(mealType != null && !mealType.isBlank(), MealRecord::getMealType, mealType)
                .and(keyword != null && !keyword.isBlank(), w -> w
                        .like(MealRecord::getCustomer, keyword)
                        .or().like(MealRecord::getRecipeName, keyword)
                        .or().like(MealRecord::getNote, keyword))
                .orderByDesc(MealRecord::getCreatedAt);
        Page<MealRecord> p = mealMapper.selectPage(new Page<>(page, pageSize), qw);
        return R.PageResult.of(p.getRecords(), p.getTotal(), page, pageSize);
    }

    public R.PageResult<Views.HealthRow> pageProfiles(int page, int pageSize, String keyword) {
        LambdaQueryWrapper<HealthProfile> qw = new LambdaQueryWrapper<HealthProfile>()
                .like(keyword != null && !keyword.isBlank(), HealthProfile::getCustomer, keyword)
                .orderByDesc(HealthProfile::getUpdatedAt);
        Page<HealthProfile> p = profileMapper.selectPage(new Page<>(page, pageSize), qw);
        List<Views.HealthRow> items = p.getRecords().stream().map(this::toRow).toList();
        return R.PageResult.of(items, p.getTotal(), page, pageSize);
    }

    public void updateProfile(String userId, HealthProfile patch) {
        HealthProfile db = profileMapper.selectById(userId);
        if (db == null) {
            patch.setUserId(userId);
            patch.setUpdatedAt(LocalDateTime.now());
            profileMapper.insert(patch);
            return;
        }
        patch.setUserId(userId);
        patch.setCustomer(db.getCustomer());
        patch.setUpdatedAt(LocalDateTime.now());
        profileMapper.updateById(patch);
    }

    public List<Views.ChronicPlanView> listPlans() {
        return planMapper.selectList(null).stream().map(this::toPlanView).toList();
    }

    public Views.ChronicPlanView savePlan(String key, ChronicPlan input) {
        ChronicPlan db = planMapper.selectById(key);
        if (db == null) {
            input.setPlanKey(key);
            input.setUpdatedAt(LocalDateTime.now());
            planMapper.insert(input);
            db = planMapper.selectById(key);
        } else {
            input.setPlanKey(key);
            input.setUpdatedAt(LocalDateTime.now());
            planMapper.updateById(input);
            db = planMapper.selectById(key);
        }
        return toPlanView(db);
    }

    private Views.HealthRow toRow(HealthProfile p) {
        double bmi = p.getWeight() == null || p.getHeight() == null || p.getHeight() == 0
                ? 0 : Math.round(p.getWeight() / Math.pow(p.getHeight() / 100, 2) * 10) / 10.0;
        boolean abnormal = (p.getBloodSugar() != null && p.getBloodSugar() > 7)
                || (p.getSystolic() != null && p.getSystolic() >= 140)
                || (p.getUricAcid() != null && p.getUricAcid() > 420);
        return new Views.HealthRow(p.getUserId(), p.getCustomer(), p.getHeight(), p.getWeight(),
                p.getBloodSugar(), p.getUricAcid(), p.getSystolic(), p.getDiastolic(),
                Converters.ts(p.getUpdatedAt()), bmi, abnormal ? "需关注" : "正常");
    }

    private Views.ChronicPlanView toPlanView(ChronicPlan c) {
        return new Views.ChronicPlanView(c.getPlanKey(), c.getName(), c.getIcon(), c.getColor(), c.getSummary(),
                c.getPrinciples() == null ? List.of() : Arrays.asList(c.getPrinciples().split("\n")),
                Converters.split(c.getRecommended()), Converters.split(c.getAvoid()),
                c.getUsers(), Converters.ts(c.getUpdatedAt()));
    }
}
