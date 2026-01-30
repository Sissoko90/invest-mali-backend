<<<<<<< HEAD
package abdaty_technologie.API_Invest.util;

import java.io.IOException;
import java.net.http.HttpRequest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class MultipartBodyPublisher {

    private static final String BOUNDARY = "Boundary-" + UUID.randomUUID();
    private final List<byte[]> parts = new ArrayList<>();

    public MultipartBodyPublisher addField(String name, String value) {
        String part = "--" + BOUNDARY + "\r\n" +
                "Content-Disposition: form-data; name=\"" + name + "\"\r\n" +
                "\r\n" +
                value + "\r\n";
        parts.add(part.getBytes());
        return this;
    }

    public MultipartBodyPublisher addFile(String name, Path path) throws IOException {
        return addFile(name, path, path.getFileName().toString());
    }
    
    public MultipartBodyPublisher addFile(String name, Path path, String filename) throws IOException {
        String header = "--" + BOUNDARY + "\r\n" +
                "Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + filename + "\"\r\n" +
                "Content-Type: application/zip\r\n" +
                "\r\n";

        parts.add(header.getBytes());
        parts.add(Files.readAllBytes(path));
        parts.add("\r\n".getBytes());

        return this;
    }

    public HttpRequest.BodyPublisher build() {
        parts.add(("--" + BOUNDARY + "--").getBytes());
        return HttpRequest.BodyPublishers.ofByteArrays(parts);
    }

    public String getContentType() {
        return "multipart/form-data; boundary=" + BOUNDARY;
    }

    public String getBoundary() {
        return BOUNDARY;
    }
}
=======
package abdaty_technologie.API_Invest.util;

import java.io.IOException;
import java.net.http.HttpRequest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class MultipartBodyPublisher {

    private static final String BOUNDARY = "Boundary-" + UUID.randomUUID();
    private final List<byte[]> parts = new ArrayList<>();

    public MultipartBodyPublisher addField(String name, String value) {
        String part = "--" + BOUNDARY + "\r\n" +
                "Content-Disposition: form-data; name=\"" + name + "\"\r\n" +
                "\r\n" +
                value + "\r\n";
        parts.add(part.getBytes());
        return this;
    }

    public MultipartBodyPublisher addFile(String name, Path path) throws IOException {
        return addFile(name, path, path.getFileName().toString());
    }
    
    public MultipartBodyPublisher addFile(String name, Path path, String filename) throws IOException {
        String header = "--" + BOUNDARY + "\r\n" +
                "Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + filename + "\"\r\n" +
                "Content-Type: application/zip\r\n" +
                "\r\n";

        parts.add(header.getBytes());
        parts.add(Files.readAllBytes(path));
        parts.add("\r\n".getBytes());

        return this;
    }

    public HttpRequest.BodyPublisher build() {
        parts.add(("--" + BOUNDARY + "--").getBytes());
        return HttpRequest.BodyPublishers.ofByteArrays(parts);
    }

    public String getContentType() {
        return "multipart/form-data; boundary=" + BOUNDARY;
    }

    public String getBoundary() {
        return BOUNDARY;
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
