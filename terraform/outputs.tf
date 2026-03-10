output "alb_hostname" {
  description = "The DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}
