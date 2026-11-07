package com.shiliao.security;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shiliao.entity.Role;
import com.shiliao.entity.User;
import com.shiliao.repository.RoleMapper;
import com.shiliao.repository.UserMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 解析 Authorization: Bearer &lt;token&gt;，装载当前用户与权限
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    public JwtAuthFilter(JwtTool jwtTool, UserMapper userMapper, RoleMapper roleMapper) {
        this.jwtTool = jwtTool;
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
    }

    private final JwtTool jwtTool;
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = jwtTool.parse(header.substring(7));
                String userId = claims.getSubject();
                User user = userMapper.selectById(userId);
                if (user != null && "active".equals(user.getStatus())) {
                    Set<String> perms = permissionsOf(user.getRoleKey());
                    AuthUser principal = new AuthUser(user.getId(), user.getUsername(), user.getName(), user.getRoleKey(), perms);
                    var authorities = perms.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toSet());
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRoleKey().toUpperCase()));
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(principal, null, authorities));
                }
            } catch (Exception ignored) {
                // token 无效时保持匿名，由后续鉴权失败处理
            }
        }
        chain.doFilter(request, response);
    }

    private Set<String> permissionsOf(String roleKey) {
        Role role = roleMapper.selectOne(new LambdaQueryWrapper<Role>().eq(Role::getRoleKey, roleKey));
        if (role == null || role.getPermissions() == null || role.getPermissions().isBlank()) {
            return Set.of();
        }
        return Arrays.stream(role.getPermissions().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }
}
