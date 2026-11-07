package com.shiliao.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.shiliao.common.BizException;
import com.shiliao.common.Converters;
import com.shiliao.common.R;
import com.shiliao.dto.Views;
import com.shiliao.entity.User;
import com.shiliao.repository.UserMapper;
import com.shiliao.security.AuthUser;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/** 用户管理 */
@Service
public class UserService {

    public UserService(UserMapper userMapper, PasswordEncoder passwordEncoder, AuthService authService) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public R.PageResult<Views.UserView> page(int page, int pageSize, String keyword, String roleKey, String status) {
        LambdaQueryWrapper<User> qw = new LambdaQueryWrapper<User>()
                .eq(roleKey != null && !roleKey.isBlank(), User::getRoleKey, roleKey)
                .eq(status != null && !status.isBlank(), User::getStatus, status)
                .and(keyword != null && !keyword.isBlank(), w -> w
                        .like(User::getName, keyword)
                        .or().like(User::getUsername, keyword)
                        .or().like(User::getPhone, keyword)
                        .or().like(User::getEmail, keyword))
                .orderByDesc(User::getCreatedAt);
        Page<User> p = userMapper.selectPage(new Page<>(page, pageSize), qw);
        List<Views.UserView> items = p.getRecords().stream().map(this::toView).toList();
        return R.PageResult.of(items, p.getTotal(), page, pageSize);
    }

    public Views.UserView create(User input, AuthUser operator) {
        if (userMapper.selectCount(new LambdaQueryWrapper<User>().eq(User::getUsername, input.getUsername())) > 0) {
            throw new BizException("登录名「" + input.getUsername() + "」已被占用");
        }
        input.setId(null);
        input.setPassword(passwordEncoder.encode(
                input.getPassword() == null || input.getPassword().isBlank() ? "123456" : input.getPassword()));
        input.setCreatedAt(LocalDateTime.now());
        if (input.getStatus() == null) input.setStatus("active");
        if (input.getAvatarColor() == null) input.setAvatarColor("#2f8f5b");
        userMapper.insert(input);
        authService.log(operator.getName(), "create", "用户 " + input.getUsername(), "新建用户「" + input.getName() + "」", "success");
        return toView(input);
    }

    public Views.UserView update(String id, User input, AuthUser operator) {
        User db = userMapper.selectById(id);
        if (db == null) throw new BizException(404, "用户不存在");
        input.setId(id);
        if (input.getPassword() != null && !input.getPassword().isBlank()) {
            input.setPassword(passwordEncoder.encode(input.getPassword()));
        } else {
            input.setPassword(null); // 为空不覆盖原密码
        }
        userMapper.updateById(input);
        authService.log(operator.getName(), "update", "用户 " + db.getUsername(), "更新用户「" + db.getName() + "」资料", "success");
        return toView(userMapper.selectById(id));
    }

    public void delete(String id, AuthUser operator) {
        User db = userMapper.selectById(id);
        if (db == null) throw new BizException(404, "用户不存在");
        if ("admin".equals(db.getUsername())) throw new BizException(403, "内置管理员账号不可删除");
        userMapper.deleteById(id);
        authService.log(operator.getName(), "delete", "用户 " + db.getUsername(), "删除用户「" + db.getName() + "」", "success");
    }

    private Views.UserView toView(User u) {
        return new Views.UserView(u.getId(), u.getUsername(), u.getName(), u.getPhone(), u.getEmail(),
                u.getGender(), u.getAge(), u.getConstitution(), Converters.split(u.getChronicTags()),
                u.getRoleKey(), u.getStatus(), u.getAvatarColor(),
                Converters.ts(u.getCreatedAt()), Converters.ts(u.getLastLoginAt()));
    }
}
