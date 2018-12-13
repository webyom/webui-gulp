# Generate root CA

```
openssl genrsa -out local-root-ca.key 2048
openssl req -new -x509 -days 3650 -key local-root-ca.key -out local-root-ca.crt -subj "/CN=local-root-ca"
```

# Generate key and request file

```
openssl genrsa -out kreditme.com.key 2048
openssl req -new -key kreditme.com.key -out kreditme.com.csr -subj "/CN=*.kreditme.com"
```

# Generate CA and sign with root CA

```
openssl x509 -req -in kreditme.com.csr -CA local-root-ca.crt -CAkey local-root-ca.key -CAcreateserial -days 3560 -out kreditme.com.crt -extfile kreditme.com.ini -extensions ext
```
