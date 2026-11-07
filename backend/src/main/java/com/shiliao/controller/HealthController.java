package com.shiliao.controller;

import com.shiliao.common.R;
import com.shiliao.dto.Views;
import com.shiliao.entity.HealthProfile;
import com.shiliao.entity.MealRecord;
import com.shiliao.service.HealthService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 用餐记录、健康档案、慢病方案 */
@RestController
@RequestMapping("/api")
public class HealthController {

    public HealthController(HealthService service) {
        this.service = service;
    }

    private final HealthService service;

    @GetMapping("/meals")
    @PreAuthorize("hasAuthority('meal:view')")
    public R<R.PageResult<MealRecord>> meals(@RequestParam(defaultValue = "1") int page,
                                             @RequestParam(defaultValue = "12") int pageSize,
                                             @RequestParam(required = false) String keyword,
                                             @RequestParam(required = false) String mealType) {
        return R.ok(service.pageMeals(page, pageSize, keyword, mealType));
    }

    @GetMapping("/profiles")
    @PreAuthorize("hasAuthority('health:view')")
    public R<R.PageResult<Views.HealthRow>> profiles(@RequestParam(defaultValue = "1") int page,
                                                     @RequestParam(defaultValue = "10") int pageSize,
                                                     @RequestParam(required = false) String keyword) {
        return R.ok(service.pageProfiles(page, pageSize, keyword));
    }

    @PutMapping("/profiles/{userId}")
    @PreAuthorize("hasAuthority('health:manage')")
    public R<Void> updateProfile(@PathVariable String userId, @RequestBody HealthProfile patch) {
        service.updateProfile(userId, patch);
        return R.ok();
    }

    @GetMapping("/plans")
    @PreAuthorize("hasAuthority('plan:manage')")
    public R<List<Views.ChronicPlanView>> plans() {
        return R.ok(service.listPlans());
    }

    @PutMapping("/plans/{key}")
    @PreAuthorize("hasAuthority('plan:manage')")
    public R<Views.ChronicPlanView> savePlan(@PathVariable String key,
                                             @RequestBody com.shiliao.entity.ChronicPlan input) {
        return R.ok(service.savePlan(key, input));
    }
}
