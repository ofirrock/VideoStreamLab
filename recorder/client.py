# pylint:disable=E1101
from socket import socket
from zlib import decompress
import lz4.frame
import lz4framed

import pygame
from pygame.locals import Rect

WIDTH = 640
HEIGHT = 480


def recvall(conn, length):
    """ Retreive all pixels. """

    buf = b''
    while len(buf) < length:
        data = conn.recv(length - len(buf))
        if not data:
            return data
        buf += data
    return buf


def main(host='127.0.0.1', port=5000):
    pygame.init()
    FPS_FONT = pygame.font.SysFont("Verdana", 20)
    GOLDENROD = pygame.Color("goldenrod")

    def show_fps(window, clock):
        pygame.draw.rect(window, (0, 0, 0), Rect((0, 0), (60, 30)))
        fps_overlay = FPS_FONT.render(
            "{0:.2f}".format(clock.get_fps()), True, GOLDENROD)
        window.blit(fps_overlay, (0, 0))

    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    clock = pygame.time.Clock()
    watching = True

    sock = socket()
    sock.connect((host, port))
    try:
        while watching:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    watching = False
                    break

            # Retreive the size of the pixels length,
            # the pixels length and pixels
            size_len = int.from_bytes(sock.recv(1), byteorder='big')
            size = int.from_bytes(sock.recv(size_len), byteorder='big')
            pixels = lz4framed.decompress(recvall(sock, size))

            # Create the Surface from raw pixels
            img = pygame.image.fromstring(pixels, (WIDTH, HEIGHT), 'RGB')

            # Display the picture
            screen.blit(img, (0, 0))
            show_fps(screen, clock)
            pygame.display.flip()
            clock.tick(60)
    finally:
        sock.close()


if __name__ == '__main__':
    main()
